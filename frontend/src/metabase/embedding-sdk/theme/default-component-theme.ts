import { merge } from "icepick";

import { OVERLAY_Z_INDEX } from "metabase/css/core/overlays/constants";
import { EMBEDDING_SDK_PORTAL_ROOT_ELEMENT_ID } from "metabase/embedding-sdk/config";
import type { MetabaseComponentTheme } from "metabase/embedding-sdk/theme";
import type { DeepPartial } from "metabase/embedding-sdk/types/utils";
import type { MantineThemeOverride } from "metabase/ui";

export const DEFAULT_SDK_FONT_SIZE = 14;

// Use em units to scale font sizes relative to the base font size.
// The em unit is used by default in the embedding SDK.
const units = (px: number) => ({
  px: `${px}px`,
  em: `${px / DEFAULT_SDK_FONT_SIZE}em`,
});

const FONT_SIZES = {
  tableCell: units(12.5),
  pivotTableCell: units(12),
  label: units(12),
  goalLabel: units(14),
};

/**
 * Default theme options for Metabase components.
 *
 * While these theme options are primarily used by the React Embedding SDK
 * to provide extra customization for SDK users,
 * the options below are used to provide default values to components
 * such as charts, data tables and popovers.
 */
export const DEFAULT_METABASE_COMPONENT_THEME: MetabaseComponentTheme = {
  collectionBrowser: {
    breadcrumbs: {
      expandButton: {
        textColor: "var(--mb-color-text-medium)",
        backgroundColor: "var(--mb-color-bg-light)",
        hoverTextColor: "var(--mb-color-text-white)",
        hoverBackgroundColor: "var(--mb-color-brand)",
      },
    },
    emptyContent: {
      icon: {
        width: "117",
        height: "94",
      },
      title: {
        fontSize: "1.5rem",
      },
      subtitle: {
        fontSize: "1rem",
      },
    },
  },
  dashboard: {
    backgroundColor: "var(--mb-color-bg-white)",
    card: {
      backgroundColor: "var(--mb-color-bg-white)",
    },
  },
  question: {
    backgroundColor: "transparent",
  },

  table: {
    cell: {
      fontSize: FONT_SIZES.tableCell.px,
      textColor: "var(--mb-color-text-primary)",
    },
    idColumn: {
      textColor: "var(--mb-color-brand)",
    },
  },
  pivotTable: {
    cell: {
      fontSize: FONT_SIZES.pivotTableCell.px,
    },
    rowToggle: {
      textColor: "text-white",
      backgroundColor: "text-light", // TODO: should it be "bg-dark" ?
    },
  },
  cartesian: {
    label: { fontSize: FONT_SIZES.label.px },
    goalLine: {
      label: { fontSize: FONT_SIZES.goalLabel.px },
    },
    splitLine: {
      lineStyle: {
        color: "var(--mb-color-border)",
      },
    },
  },
  popover: {
    zIndex: OVERLAY_Z_INDEX,
  },
};

/**
 * Default theme options, with overrides specific to the
 * Embedding SDK environment to provide nicer defaults.
 */
export const DEFAULT_EMBEDDED_COMPONENT_THEME: MetabaseComponentTheme = merge<
  MetabaseComponentTheme,
  DeepPartial<MetabaseComponentTheme>
>(DEFAULT_METABASE_COMPONENT_THEME, {
  table: {
    cell: {
      fontSize: FONT_SIZES.tableCell.em,
    },
  },
  pivotTable: {
    cell: {
      fontSize: FONT_SIZES.pivotTableCell.em,
    },
  },
  cartesian: {
    padding: "0.5rem 1rem",
    label: { fontSize: FONT_SIZES.label.em },
    goalLine: {
      label: { fontSize: FONT_SIZES.goalLabel.em },
    },
  },
  collectionBrowser: {
    breadcrumbs: {
      expandButton: {
        backgroundColor: "transparent",
        hoverTextColor: "var(--mb-color-text-white)",
        hoverBackgroundColor: "var(--mb-color-brand)",
      },
    },
  },
});

// What's up with the commented `satisfies`?
// Mantine docs says they don't typecheck default props because of performance reasons.
// To be sure to not slow down typescript I left the check commented.
// If you change any of the default props please verify that the types are correct

export function getEmbeddingComponentOverrides(): MantineThemeOverride["components"] {
  return {
    HoverCard: {
      defaultProps: {
        withinPortal: true,
        portalProps: {
          target: `#${EMBEDDING_SDK_PORTAL_ROOT_ELEMENT_ID}`,
        },
      },
    },
    ModalRoot: {
      defaultProps: {
        withinPortal: true,
        portalProps: {
          target: `#${EMBEDDING_SDK_PORTAL_ROOT_ELEMENT_ID}`,
        },
      }, // satisfies Partial<ModalRootProps>,
    },
    Modal: {
      defaultProps: {
        withinPortal: true,
        portalProps: {
          target: `#${EMBEDDING_SDK_PORTAL_ROOT_ELEMENT_ID}`,
        },
      }, // satisfies Partial<ModalProps>,
    },
    Popover: {
      defaultProps: {
        withinPortal: true,
        portalProps: {
          target: `#${EMBEDDING_SDK_PORTAL_ROOT_ELEMENT_ID}`,
        },
      }, // satisfies Partial<PopoverProps>,
    },
    Tooltip: {
      defaultProps: {
        withinPortal: true,
        portalProps: {
          target: `#${EMBEDDING_SDK_PORTAL_ROOT_ELEMENT_ID}`,
        },
      }, // satisfies Partial<TooltipProps>,
    },
  };
}
