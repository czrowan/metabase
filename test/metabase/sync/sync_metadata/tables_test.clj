(ns metabase.sync.sync-metadata.tables-test
  "Test for the logic that syncs Table models with the metadata fetched from a DB."
  (:require
   [clojure.java.jdbc :as jdbc]
   [clojure.test :refer :all]
   [metabase.driver :as driver]
   [metabase.driver.sql-jdbc.connection :as sql-jdbc.conn]
   [metabase.driver.sql-jdbc.execute :as sql-jdbc.execute]
   [metabase.sync.core :as sync]
   [metabase.sync.sync-metadata :as sync-metadata]
   [metabase.sync.sync-metadata.tables :as sync-tables]
   [metabase.test :as mt]
   [metabase.test.data.interface :as tx]
   [metabase.test.data.sql :as sql.tx]
   [metabase.test.mock.toucanery :as toucanery]
   [metabase.util :as u]
   [metabase.warehouse-schema.models.table :as table]
   [next.jdbc :as next.jdbc]
   [toucan2.core :as t2]))

(tx/defdataset db-with-a-crufty-table
  [["acquired_toucans"
    [{:field-name "species"              :base-type :type/Text}
     {:field-name "cam_has_acquired_one" :base-type :type/Boolean}]
    [["Toco"               false]
     ["Chestnut-Mandibled" true]
     ["Keel-billed"        false]
     ["Channel-billed"     false]]]
   ["south_migrationhistory"
    [{:field-name "app_name"  :base-type :type/Text}
     {:field-name "migration" :base-type :type/Text}]
    [["main" "0001_initial"]
     ["main" "0002_add_toucans"]]]])

(deftest crufty-tables-test
  (testing "south_migrationhistory, being a CRUFTY table, should still be synced, but marked as such"
    (mt/dataset metabase.sync.sync-metadata.tables-test/db-with-a-crufty-table
      (is (= #{{:name "SOUTH_MIGRATIONHISTORY" :visibility_type :cruft :initial_sync_status "complete"}
               {:name "ACQUIRED_TOUCANS"       :visibility_type nil :initial_sync_status "complete"}}
             (set (for [table (t2/select [:model/Table :name :visibility_type :initial_sync_status] :db_id (mt/id))]
                    (into {} table))))))))

(deftest retire-tables-test
  (testing "`retire-tables!` should retire the Table(s) passed to it, not all Tables in the DB -- see #9593"
    (mt/with-temp [:model/Database db {}
                   :model/Table    table-1 {:name "Table 1" :db_id (u/the-id db)}
                   :model/Table    _       {:name "Table 2" :db_id (u/the-id db)}]
      (#'sync-tables/retire-tables! db #{{:name "Table 1" :schema (:schema table-1)}})
      (is (= {"Table 1" false "Table 2" true}
             (t2/select-fn->fn :name :active :model/Table :db_id (u/the-id db)))))))

(deftest sync-table-update-info-of-new-table-added-during-sync-test
  (testing "during sync, if a table is reactivated, we should update the table info if needed"
    (let [dbdef (mt/dataset-definition "sync-retired-table"
                                       [["user" [{:field-name "name" :base-type :type/Text}] [["Ngoc"]]]])]
      (mt/dataset dbdef
        (t2/update! :model/Table (mt/id :user) {:active false})
        ;; table description is changed
        (jdbc/execute! (sql-jdbc.conn/db->pooled-connection-spec (mt/db))
                       [(sql.tx/standalone-table-comment-sql
                         (:engine (mt/db))
                         dbdef
                         (tx/map->TableDefinition {:table-name "user" :table-comment "added comment"}))])
        (sync/sync-database! (mt/db) {:sync :schema})
        (is (=? {:active true
                 :description "added comment"}
                (t2/select-one :model/Table (mt/id :user))))))))

(deftest sync-estimated-row-count-test
  (mt/test-driver :postgres
    (testing "Can sync row count"
      (mt/dataset test-data
        ;; row count is estimated so we VACUUM so the statistic table is updated before syncing
        (sql-jdbc.execute/do-with-connection-with-options
         driver/*driver*
         (mt/db)
         nil
         (fn [conn]
           (next.jdbc/execute! conn ["VACUUM;"])))
        (sync/sync-database! (mt/db) {:scan :schema})
        (is (= 100
               (t2/select-one-fn :estimated_row_count :model/Table (mt/id :venues))))))))

(defmacro ^:private run-twice
  "Run body twice. In this case, we are checking that creating and updating syncs the tables correctly w.r.t.
  cruftiness."
  [& body]
  `(do ~@body ~@body))

(deftest auto-cruft-all-tables-test
  (testing "Make sure a db's settings.auto-cruft-tables actually mark tables as crufty"
    (mt/with-temp [:model/Database db {:engine ::toucanery/toucanery
                                       :settings {:auto-cruft-tables [".*"]}}]
      (run-twice
       (sync-metadata/sync-db-metadata! db)
       (is (= #{:cruft}
              (t2/select-fn-set :visibility_type
                                :model/Table
                                :db_id
                                (u/the-id db))))))))

(deftest cruft-does-not-happen-during-update-test
  (testing "Make sure a db's settings.auto-cruft-tables actually mark tables as crufty"
    (mt/with-temp [:model/Database db {:engine ::toucanery/toucanery
                                       :settings {:auto-cruft-tables [".*"]}}]
      (let [->tables-info #(t2/select-fn-set (juxt :name :visibility_type) :model/Table :db_id (u/the-id db))]
        (sync-metadata/sync-db-metadata! db)
        (testing "Observe: the tables are marked as crufty"
          (is (= #{["employees" :cruft] ["transactions" :cruft]} (->tables-info))))
        ;; make employees visible:
        (t2/update! :model/Table :db_id (u/the-id db) :name "employees" {:visibility_type nil})
        (testing "Observe: employees is visible, but transactions is still crufty"
          (is (= #{["employees" nil] ["transactions" :cruft]} (->tables-info))))
        (sync-metadata/sync-db-metadata! db)
        (testing "tables are unchanged after sync"
          (is (= #{["employees" nil] ["transactions" :cruft]} (->tables-info))))))))

(defn run-auto-cruft-hidden-test! [original-vis-type]
  (testing (str "Make sure a db's settings.auto-cruft-tables do not unhide " original-vis-type " tables")
    (mt/with-temp [:model/Database db {:engine ::toucanery/toucanery
                                       :settings {:auto-cruft-tables []}}]
      (sync-metadata/sync-db-metadata! db)
      (t2/update! :model/Table :db_id (u/the-id db) {:visibility_type original-vis-type})
      (sync-metadata/sync-db-metadata! db)
      (is (= #{["employees" original-vis-type]
               ["transactions" original-vis-type]}
             (t2/select-fn-set (juxt :name :visibility_type) :model/Table :db_id (u/the-id db)))))))

(deftest auto-cruft-no-tables-hidden-test
  (doseq [vis-type (sort table/visibility-types)]
    (run-auto-cruft-hidden-test! vis-type)))

(deftest auto-cruft-employee-table-test
  (testing "Make sure a db's settings.auto-cruft-tables actually mark tables as crufty"
    (mt/with-temp [:model/Database db {:engine ::toucanery/toucanery
                                       :settings {:auto-cruft-tables ["employees"]}}]
      (run-twice
       (sync-metadata/sync-db-metadata! db)
       (is (= #{["employees" :cruft]
                ["transactions" nil]}
              (t2/select-fn-set (juxt :name :visibility_type) :model/Table :db_id (u/the-id db))))))))

(deftest auto-cruft-tables-with-an-l-test
  (testing "Make sure a db's settings.auto-cruft-tables actually mark tables as crufty"
    (mt/with-temp [:model/Database db {:engine ::toucanery/toucanery
                                       :settings {:auto-cruft-tables ["l"]}}]
      (run-twice
       (sync-metadata/sync-db-metadata! db)
       (is (= #{["employees" :cruft]
                ["transactions" nil]}
              (t2/select-fn-set (juxt :name :visibility_type) :model/Table :db_id (u/the-id db))))))))

(deftest auto-cruft-tables-with-an-l-or-a-y-test
  (testing "Make sure a db's settings.auto-cruft-tables actually mark tables as crufty"
    (mt/with-temp [:model/Database db {:engine ::toucanery/toucanery
                                       :settings {:auto-cruft-tables ["l" "y"]}}]
      (run-twice
       (sync-metadata/sync-db-metadata! db)
       (is (= #{["employees" :cruft]
                ["transactions" nil]}
              (t2/select-fn-set (juxt :name :visibility_type) :model/Table :db_id (u/the-id db))))))))
