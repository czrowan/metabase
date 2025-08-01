(ns ^:mb/driver-tests metabase.app-db.liquibase-test
  (:require
   [clojure.string :as str]
   [clojure.test :refer :all]
   [metabase.app-db.core :as mdb]
   [metabase.app-db.liquibase :as liquibase]
   [metabase.app-db.test-util :as mdb.test-util]
   [metabase.driver :as driver]
   [metabase.driver.sql-jdbc.connection :as sql-jdbc.conn]
   [metabase.driver.sql-jdbc.execute :as sql-jdbc.execute]
   [metabase.test :as mt]
   [next.jdbc :as next.jdbc]
   [toucan2.core :as t2])
  (:import
   (clojure.lang ExceptionInfo)
   (liquibase Liquibase)
   (liquibase.lockservice LockServiceFactory)))

(set! *warn-on-reflection* true)

(defn- split-migrations-sqls
  "Splits a sql migration string to multiple lines."
  [sql]
  (->> (str/split sql #"(;(\r)?\n)|(--.*\n)")
       (map str/trim)
       (remove (fn [s] (or
                        (str/blank? s)
                        (str/starts-with? s "--"))))))

(deftest mysql-engine-charset-test
  (mt/test-driver :mysql
    (testing "Make sure MySQL CREATE DATABASE statements have ENGINE/CHARACTER SET appended to them (#10691)"
      (sql-jdbc.execute/do-with-connection-with-options
       :mysql
       (sql-jdbc.conn/connection-details->spec :mysql
                                               (mt/dbdef->connection-details :mysql :server nil))
       {:write? true}
       (fn [^java.sql.Connection conn]
         (doseq [statement ["DROP DATABASE IF EXISTS liquibase_test;"
                            "CREATE DATABASE liquibase_test;"]]
           (next.jdbc/execute! conn [statement]))))
      (liquibase/with-liquibase [liquibase (->> (mt/dbdef->connection-details :mysql :db {:database-name "liquibase_test"})
                                                (sql-jdbc.conn/connection-details->spec :mysql)
                                                mdb.test-util/->ClojureJDBCSpecDataSource)]
        (testing "Make sure *every* line contains ENGINE ... CHARACTER SET ... COLLATE"
          (doseq [line  (split-migrations-sqls (liquibase/migrations-sql liquibase))
                  :when (str/starts-with? line "CREATE TABLE")]
            (is (true?
                 (or
                  (str/includes? line "ENGINE InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
                  (str/includes? line "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci")))
                (format "%s should include ENGINE ... CHARACTER SET ... COLLATE ..." (pr-str line)))))))))

(deftest consolidate-liquibase-changesets-test
  (mt/test-drivers #{:h2 :mysql :postgres}
    (mt/with-temp-empty-app-db [conn driver/*driver*]
      ;; fake a db where we ran all the migrations, including the legacy ones
      (with-redefs [liquibase/decide-liquibase-file (fn [& _args] @#'liquibase/changelog-legacy-file)]
        (liquibase/with-liquibase [liquibase conn]
          (let [table-name (liquibase/changelog-table-name liquibase)]
            (.update liquibase "")

            (liquibase/consolidate-liquibase-changesets! conn liquibase)

            (testing "makes sure the change log filename are correctly set"
              (is (= (set (mdb.test-util/liquibase-file->included-ids "migrations/000_legacy_migrations.yaml" driver/*driver* conn))
                     (t2/select-fn-set :id table-name :filename "migrations/000_legacy_migrations.yaml")))

              (is (= (set (mdb.test-util/liquibase-file->included-ids "migrations/001_update_migrations.yaml" driver/*driver* conn))
                     (t2/select-fn-set :id table-name :filename "migrations/001_update_migrations.yaml")))

              (is (= []
                     (remove #(str/starts-with? % "v56.") (t2/select-fn-set :id table-name :filename "migrations/056_update_migrations.yaml"))))

              (is (= (t2/select-fn-set :id table-name)
                     (set (mdb.test-util/all-liquibase-ids true driver/*driver* conn)))))))))))

(deftest wait-for-all-locks-test
  (mt/test-drivers #{:h2 :mysql :postgres}
    (mt/with-temp-empty-app-db [conn driver/*driver*]
      ;; We don't need a long time for tests, keep it zippy.
      (let [sleep-ms   5
            timeout-ms 10]
        (liquibase/with-liquibase [liquibase conn]
          (testing "Will not wait if no locks are taken"
            (is (= :none (liquibase/wait-for-all-locks sleep-ms timeout-ms))))
          (testing "Will timeout if a lock is not released"
            (liquibase/with-scope-locked liquibase
              (is (= :timed-out (liquibase/wait-for-all-locks sleep-ms timeout-ms)))))
          (testing "Will return successfully if the lock is released while we are waiting"
            (let [migrate-ms 100
                  timeout-ms 200
                  locked     (promise)]
              (future
                (liquibase/with-scope-locked liquibase
                  (deliver locked true)
                  (Thread/sleep migrate-ms)))
              @locked
              (is (= :done (liquibase/wait-for-all-locks sleep-ms timeout-ms))))))))))

(deftest release-all-locks-if-needed!-test
  (mt/test-drivers #{:h2}
    (mt/with-temp-empty-app-db [conn driver/*driver*]
      (liquibase/with-liquibase [liquibase conn]
        (testing "When we release the locks from outside the migration...\n"
          (let [locked   (promise)
                released (promise)
                locked?  (promise)]
            (future
              (liquibase/with-scope-locked liquibase
                (is (liquibase/holding-lock? liquibase))
                (deliver locked true)
                @released
                (deliver locked? (liquibase/holding-lock? liquibase))))
            @locked
            (liquibase/release-concurrent-locks! conn)
            (deliver released true)
            (testing "The lock was released before the migration finished"
              (is (not @locked?)))))))))

(deftest auto-release-session-lock-test
  (mt/test-drivers #{:mysql :postgres}
    (testing "Session lock is released on conn close"
      ;; Session lock provided automatically by the com.github.blagerweij/liquibase-sessionlock dependency
      (mt/with-temp-empty-app-db [_conn driver/*driver*]
        (let [;; use data-source so with-liquibase opens and closes the conn itself
              data-source (mdb/data-source)
              lock        (fn [^Liquibase liquibase]
                            (->> liquibase
                                 .getDatabase
                                 (.getLockService (LockServiceFactory/getInstance))
                                 .acquireLock))]
          (liquibase/with-liquibase [liquibase1 data-source]
            (is (lock liquibase1) "Can initially acquire session lock")
            (is (lock liquibase1) "Can require acquire session lock on same liquibase")
            (liquibase/with-liquibase [liquibase2 data-source]
              (is (not (lock liquibase2)) "Cannot acquire session lock on a different liquibase while it is taken")))
          (liquibase/with-liquibase [liquibase3 data-source]
            ;; This will fail if the com.github.blagerweij/liquibase-sessionlock dep is not present
            (is (lock liquibase3) "Can acquire session lock when conn closed without lock release")))))))

(deftest latest-available-major-version
  (mt/test-drivers #{:h2}
    (mt/with-temp-empty-app-db [conn driver/*driver*]
      (liquibase/with-liquibase [liquibase conn]
        (is (< 52 (liquibase/latest-available-major-version liquibase)))))))

(deftest latest-applied-major-version
  (mt/test-drivers #{:h2 :mysql :postgres}
    (mt/with-temp-empty-app-db [conn driver/*driver*]
      (liquibase/with-liquibase [liquibase conn]
        (is (nil? (liquibase/latest-applied-major-version conn (.getDatabase liquibase))))
        (.update liquibase "")
        (is (< 52 (liquibase/latest-applied-major-version conn (.getDatabase liquibase))))))))

(deftest rollback-major-version
  (mt/test-drivers #{:h2 :mysql :rollback}
    (mt/with-temp-empty-app-db [conn driver/*driver*]
      (liquibase/with-liquibase [liquibase conn]
        (.update liquibase "")

        (let [actual-latest-applied-version (liquibase/latest-applied-major-version conn (.getDatabase liquibase))
              actual-latest-available-version (liquibase/latest-available-major-version liquibase)]
          (testing "Can downgrade and re-upgrade version"
            (liquibase/rollback-major-version! conn liquibase false (dec actual-latest-available-version))
            (is (= (dec actual-latest-applied-version) (liquibase/latest-applied-major-version conn (.getDatabase liquibase))))

            (liquibase/rollback-major-version! conn liquibase false (- actual-latest-available-version 2))
            (is (= (- actual-latest-available-version 2) (liquibase/latest-applied-major-version conn (.getDatabase liquibase))))

            (.update liquibase "")
            (is (= actual-latest-applied-version (liquibase/latest-applied-major-version conn (.getDatabase liquibase)))))

          (testing "Cannot downgrade when there are changests from a newer version already ran which are not in the changelog file"
            (with-redefs [liquibase/latest-applied-major-version (constantly (inc actual-latest-applied-version))]
              (is (thrown-with-msg? ExceptionInfo #"Cannot downgrade.*"
                                    (liquibase/rollback-major-version! conn liquibase false (dec actual-latest-available-version))))
              (testing "CAN downgrade if forced"
                (liquibase/rollback-major-version! conn liquibase true (dec actual-latest-available-version))))))))))
