import cx from "classnames";
import { c, t } from "ttag";

import { getCurrentVersion } from "metabase/admin/app/selectors";
import { useGetVersionInfoQuery } from "metabase/api";
import ExternalLink from "metabase/common/components/ExternalLink";
import ButtonsS from "metabase/css/components/buttons.module.css";
import CS from "metabase/css/core/index.css";
import { useSelector } from "metabase/lib/redux";
import { newVersionAvailable, versionIsLatest } from "metabase/lib/utils";
import type { VersionInfo, VersionInfoRecord } from "metabase-types/api";

import S from "./VersionUpdateNotice.module.css";

export function VersionUpdateNotice() {
  const { data: versionInfo } = useGetVersionInfoQuery();
  const currentVersion = useSelector(getCurrentVersion);
  const latestVersion = versionInfo?.latest?.version;
  const displayVersion = formatVersion(currentVersion);

  if (latestVersion && versionIsLatest({ currentVersion, latestVersion })) {
    return <OnLatestVersion currentVersion={displayVersion} />;
  }

  if (latestVersion && newVersionAvailable({ currentVersion, latestVersion })) {
    return (
      <NewVersionAvailable
        currentVersion={displayVersion}
        latestVersion={latestVersion}
        versionInfo={versionInfo}
      />
    );
  }
  return <DefaultUpdateMessage currentVersion={displayVersion} />;
}

function OnLatestVersion({ currentVersion }: { currentVersion: string }) {
  return (
    <div>
      <div className={S.message}>
        {c(`{0} is a version number`)
          .t`You're running Metabase ${currentVersion} which is the latest and greatest!`}
      </div>
    </div>
  );
}

function DefaultUpdateMessage({ currentVersion }: { currentVersion: string }) {
  return (
    <div>
      <div className={S.message}>
        {c(`{0} is a version number`)
          .t`You're running Metabase ${currentVersion}`}
      </div>
    </div>
  );
}

function NewVersionAvailable({
  currentVersion,
  latestVersion,
  versionInfo,
}: {
  currentVersion: string;
  latestVersion: string;
  versionInfo?: VersionInfo | null;
}) {
  const lastestVersionInfo = versionInfo?.latest;

  return (
    <div>
      <div
        className={cx(
          S.container,
          CS.p2,
          CS.bordered,
          CS.rounded,
          CS.borderSuccess,
          CS.flex,
          CS.flexRow,
          CS.alignCenter,
          CS.justifyBetween,
        )}
      >
        <span className={cx(CS.textWhite, CS.textBold)}>
          {t`Metabase ${formatVersion(latestVersion)} is available. You're running ${currentVersion}.`}
        </span>
        <ExternalLink
          className={cx(
            ButtonsS.Button,
            ButtonsS.ButtonWhite,
            ButtonsS.ButtonMedium,
            CS.borderless,
          )}
          href={
            "https://www.metabase.com/docs/" +
            latestVersion +
            "/operations-guide/upgrading-metabase.html"
          }
        >
          {t`Update`}
        </ExternalLink>
      </div>

      {versionInfo && (
        <div
          className={cx(
            CS.textMedium,
            CS.bordered,
            CS.rounded,
            CS.p2,
            CS.mt2,
            CS.overflowYScroll,
          )}
          style={{ height: 330 }}
        >
          <h3 className={cx(CS.pb3, CS.textUppercase)}>{t`What's Changed:`}</h3>

          {lastestVersionInfo && <Version version={lastestVersionInfo} />}

          {versionInfo.older &&
            versionInfo.older.map((version, index) => (
              <Version key={index} version={version} />
            ))}
        </div>
      )}
    </div>
  );
}

function Version({ version }: { version: VersionInfoRecord }) {
  if (!version) {
    return null;
  }

  return (
    <div className={CS.pb3}>
      <h3 className={CS.textMedium}>{formatVersion(version.version)}</h3>
      <ul style={{ listStyleType: "disc", listStylePosition: "inside" }}>
        {version.highlights &&
          version.highlights.map((highlight, index) => (
            <li key={index} style={{ lineHeight: "1.5" }} className={CS.pl1}>
              {highlight}
            </li>
          ))}
      </ul>
    </div>
  );
}

function formatVersion(versionLabel = "") {
  return versionLabel.replace(/^v/, "");
}
