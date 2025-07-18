import { useCallback } from "react";
import _ from "underscore";

import { useSetDashboardAttributeHandler } from "metabase/dashboard/components/Dashboard/use-set-dashboard-attribute";
import { SIDEBAR_NAME } from "metabase/dashboard/constants";
import {
  getEditingParameter,
  getEditingParameterInlineDashcard,
  getParameters,
} from "metabase/dashboard/selectors";
import { useSelector } from "metabase/lib/redux";
import DashboardSubscriptionsSidebar from "metabase/notifications/DashboardSubscriptionsSidebar";
import { ParameterSidebar } from "metabase/parameters/components/ParameterSidebar";
import { hasMapping } from "metabase/parameters/utils/dashboards";
import { PLUGIN_AI_ENTITY_ANALYSIS } from "metabase/plugins";
import type {
  CardId,
  DashCardId,
  DashCardVisualizationSettings,
  DashboardCard,
  DashboardId,
  DashboardTabId,
  Dashboard as IDashboard,
  ParameterId,
  TemporalUnit,
  ValuesQueryType,
  ValuesSourceConfig,
  ValuesSourceType,
  VisualizationSettings,
} from "metabase-types/api";
import type { SelectedTabId, State } from "metabase-types/store";

import { ActionSidebarConnected } from "./ActionSidebar";
import { AddCardSidebar } from "./AddCardSidebar";
import { ClickBehaviorSidebar } from "./ClickBehaviorSidebar/ClickBehaviorSidebar";
import { DashboardInfoSidebar } from "./DashboardInfoSidebar";
import { DashboardSettingsSidebar } from "./DashboardSettingsSidebar";

interface DashboardSidebarsProps {
  dashboard: IDashboard;
  removeParameter: (id: ParameterId) => void;
  addCardToDashboard: (opts: {
    dashId: DashboardId;
    cardId: CardId;
    tabId: DashboardTabId | null;
  }) => void;
  clickBehaviorSidebarDashcard: DashboardCard | null;
  onReplaceAllDashCardVisualizationSettings: (
    id: DashCardId,
    settings: DashCardVisualizationSettings | null | undefined,
  ) => void;
  onUpdateDashCardVisualizationSettings: (
    id: DashCardId,
    settings: DashCardVisualizationSettings | null | undefined,
  ) => void;
  onUpdateDashCardColumnSettings: (
    id: DashCardId,
    columnKey: string,
    settings?: Record<string, unknown> | null,
  ) => void;
  setParameterName: (id: ParameterId, name: string) => void;
  setParameterType: (
    parameterId: ParameterId,
    nextType: string,
    nextSectionId: string,
  ) => void;
  setParameterDefaultValue: (id: ParameterId, value: unknown) => void;
  setParameterIsMultiSelect: (id: ParameterId, isMultiSelect: boolean) => void;
  setParameterQueryType: (id: ParameterId, queryType: ValuesQueryType) => void;
  setParameterSourceType: (
    id: ParameterId,
    sourceType: ValuesSourceType,
  ) => void;
  setParameterSourceConfig: (
    id: ParameterId,
    config: ValuesSourceConfig,
  ) => void;
  setParameterFilteringParameters: (
    parameterId: ParameterId,
    filteringParameters: ParameterId[],
  ) => void;
  setParameterRequired: (id: ParameterId, value: boolean) => void;
  setParameterTemporalUnits: (
    parameterId: ParameterId,
    temporalUnits: TemporalUnit[],
  ) => void;
  isFullscreen: boolean;

  onCancel: () => void;
  sidebar: State["dashboard"]["sidebar"];
  closeSidebar: () => void;
  selectedTabId: SelectedTabId;
}

export function DashboardSidebars({
  dashboard,
  removeParameter,
  addCardToDashboard,
  clickBehaviorSidebarDashcard,
  onReplaceAllDashCardVisualizationSettings,
  onUpdateDashCardVisualizationSettings,
  onUpdateDashCardColumnSettings,
  setParameterName,
  setParameterType,
  setParameterDefaultValue,
  setParameterIsMultiSelect,
  setParameterQueryType,
  setParameterSourceType,
  setParameterSourceConfig,
  setParameterFilteringParameters,
  setParameterRequired,
  setParameterTemporalUnits,
  isFullscreen,
  onCancel,
  sidebar,
  closeSidebar,
  selectedTabId,
}: DashboardSidebarsProps) {
  const parameters = useSelector(getParameters);
  const editingParameter = useSelector(getEditingParameter);
  const editingParameterInlineDashcard = useSelector(
    getEditingParameterInlineDashcard,
  );

  const handleAddCard = useCallback(
    (cardId: CardId) => {
      addCardToDashboard({
        dashId: dashboard.id,
        cardId: cardId,
        tabId: selectedTabId,
      });
    },
    [addCardToDashboard, dashboard.id, selectedTabId],
  );

  const setDashboardAttribute = useSetDashboardAttributeHandler();

  if (isFullscreen) {
    return null;
  }

  switch (sidebar.name) {
    case SIDEBAR_NAME.addQuestion:
      return <AddCardSidebar onSelect={handleAddCard} onClose={closeSidebar} />;
    case SIDEBAR_NAME.action: {
      if (!sidebar.props.dashcardId) {
        return null;
      }

      const dashcardId = sidebar.props.dashcardId;

      const onUpdateVisualizationSettings = (
        settings: Partial<VisualizationSettings>,
      ) => onUpdateDashCardVisualizationSettings(dashcardId, settings);

      return (
        <ActionSidebarConnected
          dashboard={dashboard}
          dashcardId={dashcardId}
          onUpdateVisualizationSettings={onUpdateVisualizationSettings}
          onClose={closeSidebar}
        />
      );
    }
    case SIDEBAR_NAME.clickBehavior: {
      if (!clickBehaviorSidebarDashcard) {
        return null;
      }

      return (
        <ClickBehaviorSidebar
          dashboard={dashboard}
          dashcard={clickBehaviorSidebarDashcard}
          parameters={parameters}
          onUpdateDashCardVisualizationSettings={
            onUpdateDashCardVisualizationSettings
          }
          onUpdateDashCardColumnSettings={onUpdateDashCardColumnSettings}
          hideClickBehaviorSidebar={closeSidebar}
          onReplaceAllDashCardVisualizationSettings={
            onReplaceAllDashCardVisualizationSettings
          }
        />
      );
    }

    case SIDEBAR_NAME.editParameter: {
      const { id: editingParameterId } = editingParameter || {};
      const [[parameter], otherParameters] = _.partition(
        parameters,
        (p) => p.id === editingParameterId,
      );

      return (
        <ParameterSidebar
          parameter={parameter}
          editingParameterInlineDashcard={editingParameterInlineDashcard}
          otherParameters={otherParameters}
          onChangeName={setParameterName}
          onChangeType={setParameterType}
          onChangeDefaultValue={setParameterDefaultValue}
          onChangeIsMultiSelect={setParameterIsMultiSelect}
          onChangeQueryType={setParameterQueryType}
          onChangeSourceType={setParameterSourceType}
          onChangeSourceConfig={setParameterSourceConfig}
          onChangeFilteringParameters={setParameterFilteringParameters}
          onRemoveParameter={removeParameter}
          onClose={closeSidebar}
          onChangeRequired={setParameterRequired}
          onChangeTemporalUnits={setParameterTemporalUnits}
          hasMapping={hasMapping(parameter, dashboard)}
        />
      );
    }
    case SIDEBAR_NAME.settings:
      return (
        <DashboardSettingsSidebar
          dashboard={dashboard}
          onClose={closeSidebar}
        />
      );
    case SIDEBAR_NAME.sharing:
      return (
        <DashboardSubscriptionsSidebar
          dashboard={dashboard}
          onCancel={onCancel}
        />
      );
    case SIDEBAR_NAME.info:
      return (
        <DashboardInfoSidebar
          dashboard={dashboard}
          setDashboardAttribute={setDashboardAttribute}
          onClose={closeSidebar}
        />
      );
    case SIDEBAR_NAME.analyze:
      return (
        <PLUGIN_AI_ENTITY_ANALYSIS.AIDashboardAnalysisSidebar
          dashcardId={sidebar.props?.dashcardId}
          onClose={closeSidebar}
        />
      );
    default:
      return null;
  }
}
