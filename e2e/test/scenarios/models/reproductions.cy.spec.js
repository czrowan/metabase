const { H } = cy;
import { SAMPLE_DB_ID, SAMPLE_DB_SCHEMA_ID } from "e2e/support/cypress_data";
import { SAMPLE_DATABASE } from "e2e/support/cypress_sample_database";
import {
  ORDERS_DASHBOARD_ID,
  ORDERS_QUESTION_ID,
} from "e2e/support/cypress_sample_instance_data";
import {
  createMockActionParameter,
  createMockDashboardCard,
} from "metabase-types/api/mocks";

import { addWidgetStringFilter } from "../native-filters/helpers/e2e-field-filter-helpers";

import {
  openDetailsSidebar,
  turnIntoModel,
} from "./helpers/e2e-models-helpers";

const {
  ORDERS_ID,
  ORDERS,
  REVIEWS,
  REVIEWS_ID,
  PRODUCTS,
  PRODUCTS_ID,
  PEOPLE,
  PEOPLE_ID,
} = SAMPLE_DATABASE;

describe("issue 19180", () => {
  const QUESTION = {
    native: { query: "select * from products" },
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
    cy.intercept("/api/card/*/query").as("cardQuery");
  });

  it("shouldn't drop native model query results after leaving the query editor", () => {
    H.createNativeQuestion(QUESTION).then(({ body: { id: QUESTION_ID } }) => {
      cy.request("PUT", `/api/card/${QUESTION_ID}`, { type: "model" }).then(
        () => {
          cy.visit(`/model/${QUESTION_ID}/query`);
          cy.wait("@cardQuery");
          cy.button("Cancel").click();
          H.tableInteractive();
          cy.findByText("Here's where your results will appear").should(
            "not.exist",
          );
        },
      );
    });
  });
});

describe("issue 19737", () => {
  const modelName = "Orders Model";
  const personalCollectionName = "Bobby Tables's Personal Collection";

  function moveModel(modelName, collectionName) {
    openEllipsisMenuFor(modelName);
    H.popover().findByText("Move").click();

    H.entityPickerModal().within(() => {
      cy.findByRole("tab", { name: /Browse|Collections/ }).click();
      cy.findByText(collectionName).click();
      cy.button("Move").click();
    });
  }

  function openEllipsisMenuFor(item) {
    cy.findByText(item).closest("tr").find(".Icon-ellipsis").click();
  }

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
  });

  it("should show moved model in the data picker without refreshing (metabase#19737)", () => {
    cy.visit("/collection/root");

    moveModel(modelName, personalCollectionName);

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Moved model");

    cy.findByLabelText("Navigation bar").within(() => {
      cy.findByText("New").click();
    });
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Question").should("be.visible").click();

    H.entityPickerModal().within(() => {
      H.entityPickerModalTab("Collections").click();
      cy.findByText(personalCollectionName).click();
      cy.findByText(modelName);
    });
  });

  it("should not show duplicate models in the data picker after it's moved from a custom collection without refreshing (metabase#19737)", () => {
    // move "Orders Model" to "First collection"
    cy.visit("/collection/root");

    moveModel(modelName, "First collection");

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Moved model");
    // Close the modal so the next time we move the model another model will always be shown
    cy.icon("close:visible").click();

    cy.findByLabelText("Navigation bar").within(() => {
      cy.findByText("New").click();
    });
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Question").should("be.visible").click();

    // Open question picker (this is crucial) so the collection list are loaded.
    H.entityPickerModal().within(() => {
      H.entityPickerModalTab("Collections").click();
      cy.findByText("First collection").click();
      cy.findByText(modelName);
    });

    // Use back button to so the state is kept
    cy.go("back");

    // move "Orders Model" from a custom collection ("First collection") to another collection
    H.openNavigationSidebar();
    H.navigationSidebar().findByText("First collection").click();

    moveModel(modelName, personalCollectionName);

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Moved model");

    cy.findByLabelText("Navigation bar").within(() => {
      cy.findByText("New").click();
    });
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Question").should("be.visible").click();

    H.entityPickerModal().within(() => {
      H.entityPickerModalTab("Collections").click();
      cy.findByText("First collection").should("not.exist");
      H.entityPickerModalLevel(1).should("exist");
      H.entityPickerModalLevel(2).should("not.exist");
    });
  });
});

// this is only testable in OSS because EE always has models from auditv2
describe("issue 19776", { tags: "@OSS" }, () => {
  const modelName = "Orders Model";
  function openEllipsisMenuFor(item) {
    cy.findByText(item).closest("tr").find(".Icon-ellipsis").click();
  }

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
  });

  it("should reflect archived model in the data picker without refreshing (metabase#19776)", () => {
    cy.visit("/");

    cy.findByTestId("app-bar").button("New").click();
    H.popover().findByText("Question").click();
    H.entityPickerModalTab("Collections").click(); // now you see it
    H.entityPickerModal()
      .button(/Filter/)
      .click();

    H.popover().findByText("Models").should("exist");

    H.entityPickerModal().findByLabelText("Close").click();

    // navigate without a page load
    cy.findByTestId("sidebar-toggle").click();
    H.navigationSidebar().findByText("Our analytics").click();

    // archive the only model
    cy.findByTestId("collection-table").within(() => {
      openEllipsisMenuFor(modelName);
    });
    H.popover().contains("Move to trash").click();
    cy.findByTestId("undo-list").findByText("Trashed model");

    cy.findByTestId("app-bar").button("New").click();
    H.popover().findByText("Question").click();
    H.entityPickerModalTab("Collections").click(); // now you don't
    H.entityPickerModal()
      .button(/Filter/)
      .click();

    H.popover().findByText("Models").should("not.exist");
  });
});

describe("issue 20042", () => {
  beforeEach(() => {
    cy.intercept("POST", `/api/card/${ORDERS_QUESTION_ID}/query`).as("query");

    H.restore();
    cy.signInAsAdmin();

    cy.request("PUT", `/api/card/${ORDERS_QUESTION_ID}`, {
      name: "Orders Model",
      type: "model",
    });

    cy.signIn("nodata");
  });

  it("nodata user should not see the blank screen when visiting model (metabase#20042)", () => {
    cy.visit(`/model/${ORDERS_QUESTION_ID}`);

    cy.wait("@query");

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Orders Model");
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.contains("37.65");
  });
});

describe("issue 20045", () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/dataset").as("dataset");

    H.restore();
    cy.signInAsAdmin();

    cy.request("PUT", `/api/card/${ORDERS_QUESTION_ID}`, {
      name: "Orders Model",
      type: "model",
    });
  });

  it("should not add query hash on the rerun (metabase#20045)", () => {
    cy.visit(`/model/${ORDERS_QUESTION_ID}`);

    cy.wait("@dataset");

    cy.location("pathname").should(
      "eq",
      `/model/${ORDERS_QUESTION_ID}-orders-model`,
    );
    cy.location("hash").should("eq", "");

    cy.findByTestId("qb-header-action-panel").find(".Icon-refresh").click();

    cy.wait("@dataset");

    cy.location("pathname").should(
      "eq",
      `/model/${ORDERS_QUESTION_ID}-orders-model`,
    );
    cy.location("hash").should("eq", "");
  });
});

describe("issue 20517", () => {
  const modelDetails = {
    name: "20517",
    query: {
      "source-table": ORDERS_ID,
      limit: 5,
    },
    type: "model",
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();

    H.createQuestion(modelDetails).then(({ body: { id } }) => {
      cy.intercept("POST", `/api/card/${id}/query`).as("modelQuery");
      cy.intercept("PUT", `/api/card/${id}`).as("updateModel");
      cy.visit(`/model/${id}/metadata`);
      cy.wait("@modelQuery");
    });
  });

  it("should be able to save metadata changes with empty description (metabase#20517)", () => {
    cy.findByTestId("dataset-edit-bar")
      .button("Save changes")
      .should("be.disabled");
    cy.findByDisplayValue(/^This is a unique ID/).clear();
    cy.findByDisplayValue(/^This is a unique ID/).should("not.exist");
    cy.findByTestId("dataset-edit-bar")
      .button("Save changes")
      .should("not.be.disabled")
      .click();
    cy.wait("@updateModel").then(({ response: { body, statusCode } }) => {
      expect(statusCode).not.to.eq(400);
      expect(body.errors).not.to.exist;
      expect(body.description).to.be.null;
    });
    cy.button("Save failed").should("not.exist");
  });
});

describe.skip("issue 20624", () => {
  const renamedColumn = "TITLE renamed";

  const questionDetails = {
    name: "20624",
    type: "model",
    native: { query: "select * from PRODUCTS limit 2" },
    visualization_settings: {
      column_settings: { '["name","TITLE"]': { column_title: renamedColumn } },
    },
  };

  beforeEach(() => {
    cy.intercept("PUT", "/api/card/*").as("updateCard");

    H.restore();
    cy.signInAsAdmin();

    H.createNativeQuestion(questionDetails, { visitQuestion: true });
  });

  it("models metadata should override previously defined column settings (metabase#20624)", () => {
    openDetailsSidebar();
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Customize metadata").click();

    // Open settings for this column
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText(renamedColumn).click();
    // Let's set a new name for it
    cy.findByDisplayValue(renamedColumn).clear().type("Foo").blur();

    cy.button("Save changes").click();
    cy.wait("@updateCard");

    cy.get("[data-testid=cell-data]").should("contain", "Foo");
  });
});

describe("issue 20963", () => {
  const snippetName = "string 'test'";
  const questionName = "Converting questions with snippets to models";

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
  });

  it("should allow converting questions with static snippets to models (metabase#20963)", () => {
    cy.visit("/");

    H.startNewNativeQuestion();

    // Create a snippet
    cy.icon("snippet").click();
    cy.findByTestId("sidebar-content").findByText("Create snippet").click();

    H.modal().within(() => {
      cy.findByLabelText("Enter some SQL here so you can reuse it later").type(
        "'test'",
      );
      cy.findByLabelText("Give your snippet a name").type(snippetName);
      cy.findByText("Save").click();
    });

    H.NativeEditor.type("{moveToStart}select ");

    H.saveQuestion(
      questionName,
      { wrapId: true },
      {
        tab: "Browse",
        path: ["Our analytics"],
      },
    );

    // Convert into to a model
    H.openQuestionActions();
    H.popover().within(() => {
      cy.icon("model").click();
    });

    H.modal().within(() => {
      cy.findByText("Turn this into a model").click();
    });
  });
});

describe("issue 22517", () => {
  function renameColumn(column, newName) {
    cy.findByDisplayValue(column).clear().type(newName).blur();
  }

  beforeEach(() => {
    cy.intercept("POST", "/api/card/*/query").as("cardQuery");
    cy.intercept("PUT", "/api/card/*").as("updateMetadata");

    H.restore();
    cy.signInAsAdmin();

    H.createNativeQuestion(
      {
        name: "22517",
        native: { query: "select * from orders" },
        type: "model",
      },
      { visitQuestion: true },
    );

    H.openQuestionActions();
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Edit metadata").click();

    renameColumn("ID", "Foo");

    cy.button("Save changes").click();
    cy.wait("@updateMetadata");
  });

  it.skip("adding or removing a column should not drop previously edited metadata (metabase#22517)", () => {
    H.openQuestionActions();
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Edit query definition").click();

    // Make sure previous metadata changes are reflected in the UI
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Foo");

    // This will edit the original query and add the `SIZE` column
    // Updated query: `select *, case when quantity > 4 then 'large' else 'small' end size from orders`
    H.NativeEditor.focus().type(
      "{leftarrow}".repeat(" from orders".length) +
        ", case when quantity > 4 then 'large' else 'small' end size ",
    );

    cy.findByTestId("native-query-editor-container").icon("play").click();
    cy.wait("@dataset");

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Foo");

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Save changes").click();

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Foo");
  });
});

describe("issue 22518", () => {
  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
    cy.intercept("POST", "/api/dataset").as("dataset");
    H.createNativeQuestion(
      {
        native: {
          query: "select 1 id, 'a' foo",
        },
        type: "model",
      },
      { visitQuestion: true },
    );
  });

  it("UI should immediately reflect model query changes upon saving (metabase#22518)", () => {
    H.openQuestionActions();
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Edit query definition").click();

    H.NativeEditor.focus().type(", 'b' bar");
    cy.findByTestId("native-query-editor-container").icon("play").click();
    cy.wait("@dataset");

    cy.findByTestId("dataset-edit-bar").button("Save changes").click();

    cy.findAllByTestId("header-cell")
      .should("have.length", 3)
      .and("contain", "BAR");

    H.summarize();

    H.sidebar()
      .should("contain", "ID")
      .and("contain", "FOO")
      .and("contain", "BAR");
  });
});

describe.skip("issue 22519", () => {
  const questionDetails = {
    query: {
      "source-table": REVIEWS_ID,
    },
  };

  beforeEach(() => {
    cy.intercept("PUT", "/api/field/*").as("updateField");
    cy.intercept("POST", "/api/dataset").as("dataset");

    H.restore();
    cy.signInAsAdmin();

    H.DataModel.visit({
      databaseId: SAMPLE_DB_ID,
      schemaName: SAMPLE_DB_SCHEMA_ID,
      tableId: REVIEWS_ID,
      fieldId: REVIEWS.REVIEWS,
    });

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Don't cast").click();
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("UNIX seconds → Datetime").click();
    cy.wait("@updateField");
  });

  it("model query should not fail when data model is using casting (metabase#22519)", () => {
    H.createQuestion(questionDetails, { visitQuestion: true });

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("xavier");

    turnIntoModel();

    cy.wait("@dataset");
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("xavier");
  });
});

describe(
  "filtering based on the remapped column name should result in a correct query (metabase#22715)",
  { tags: "@flaky" },
  () => {
    function mapColumnTo({ table, column } = {}) {
      cy.findByText("Database column this maps to")
        .parent()
        .contains("None")
        .click();

      H.popover().findByText(table).click();
      H.popover().findByText(column).click();
    }

    beforeEach(() => {
      cy.intercept("POST", "/api/dataset").as("dataset");
      cy.intercept("PUT", "/api/card/*").as("updateModel");

      H.restore();
      cy.signInAsAdmin();

      H.createNativeQuestion({
        native: {
          query:
            'select 1 as "ID", current_timestamp::datetime as "ALIAS_CREATED_AT"',
        },
      }).then(({ body: { id } }) => {
        // Visit the question to first load metadata
        H.visitQuestion(id);

        // Turn the question into a model
        cy.request("PUT", `/api/card/${id}`, { type: "model" });

        // Let's go straight to the model metadata editor
        cy.visit(`/model/${id}/metadata`);
        // Without this Cypress fails to remap the column because an element becomes detached from the DOM.
        // This is caused by the DatasetFieldMetadataSidebar component rerendering mulitple times.
        cy.findByText("Database column this maps to");
        cy.wait(5000);

        // The first column `ID` is automatically selected
        mapColumnTo({ table: "Orders", column: "ID" });

        cy.findByText("ALIAS_CREATED_AT").click();

        // Without this Cypress fails to remap the column because an element becomes detached from the DOM.
        // This is caused by the DatasetFieldMetadataSidebar component rerendering mulitple times.
        cy.wait(5000);
        mapColumnTo({ table: "Orders", column: "Created At" });

        // Make sure the column name updated before saving
        cy.findByDisplayValue("Created At");

        cy.button("Save changes").click();
        cy.wait("@updateModel");

        cy.visit(`/model/${id}`);
        cy.wait("@dataset");
      });
    });

    it("when done through the column header action (metabase#22715-1)", () => {
      H.tableHeaderClick("Created At");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Filter by this column").click();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Today").click();

      cy.wait("@dataset");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Today").should("not.exist");

      cy.get("[data-testid=cell-data]")
        .should("have.length", 4)
        .and("contain", "Created At");
    });

    it("when done through the filter trigger (metabase#22715-2)", () => {
      H.filter();
      H.popover().within(() => {
        cy.findByText("Created At").click();
        cy.findByText("Today").click();
      });
      cy.wait("@dataset");
      cy.get("[data-testid=cell-data]")
        .should("have.length", 4)
        .and("contain", "Created At");
    });
  },
);

describe("issue 23024", () => {
  function addModelToDashboardAndVisit() {
    H.createDashboard().then(({ body: { id } }) => {
      cy.get("@modelId").then((cardId) => {
        H.addOrUpdateDashboardCard({
          dashboard_id: id,
          card_id: cardId,
        });
      });

      H.visitDashboard(id);
    });
  }

  beforeEach(() => {
    cy.intercept("POST", "/api/card/*/query").as("cardQuery");
    cy.intercept("PUT", "/api/card/*").as("updateMetadata");

    H.restore();
    cy.signInAsAdmin();

    H.createNativeQuestion(
      {
        native: {
          query: `select *
                  from products limit 5`,
        },
        type: "model",
      },
      { wrapId: true, idAlias: "modelId" },
    );

    cy.get("@modelId").then((modelId) => {
      H.setModelMetadata(modelId, (field) => {
        if (field.display_name === "CATEGORY") {
          return {
            ...field,
            id: PRODUCTS.CATEGORY,
            display_name: "Category",
            semantic_type: "type/Category",
          };
        }

        return field;
      });
    });

    addModelToDashboardAndVisit();
  });

  it("should not be possible to apply the dashboard filter to the native model (metabase#23024)", () => {
    H.editDashboard();

    H.setFilter("Text or Category", "Is");

    H.getDashboardCard().within(() => {
      cy.findByText(/Models are data sources/).should("be.visible");
      cy.findByText("Select…").should("not.exist");
    });
  });
});

describe("issue 23421", () => {
  const query =
    'SELECT 1 AS "id", current_timestamp::timestamp AS "created_at"';

  const emptyColumnsQuestionDetails = {
    native: {
      query,
    },
    displayIsLocked: true,
    visualization_settings: {
      "table.columns": [],
      "table.pivot_column": "orphaned1",
      "table.cell_column": "orphaned2",
    },
    type: "model",
  };

  const hiddenColumnsQuestionDetails = {
    native: {
      query,
    },
    displayIsLocked: true,
    visualization_settings: {
      "table.columns": [
        {
          name: "id",
          key: '["name","id"]',
          enabled: false,
          fieldRef: ["field", "id", { "base-type": "type/Integer" }],
        },
        {
          name: "created_at",
          key: '["name","created_at"]',
          enabled: false,
          fieldRef: ["field", "created_at", { "base-type": "type/DateTime" }],
        },
      ],
      "table.pivot_column": "orphaned1",
      "table.cell_column": "orphaned2",
    },
    type: "model",
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
  });

  it("`visualization_settings` should not break UI (metabase#23421)", () => {
    H.createNativeQuestion(emptyColumnsQuestionDetails, {
      visitQuestion: true,
    });
    H.openQuestionActions();
    H.popover().findByText("Edit query definition").click();

    H.NativeEditor.get().should("be.visible").and("contain", query);
    cy.findByRole("columnheader", { name: "id" }).should("be.visible");
    cy.findByRole("columnheader", { name: "created_at" }).should("be.visible");
    cy.button("Save changes").should("be.visible");
  });

  it("`visualization_settings` with hidden columns should not break UI (metabase#23421)", () => {
    H.createNativeQuestion(hiddenColumnsQuestionDetails, {
      visitQuestion: true,
    });
    H.openQuestionActions();
    H.popover().findByText("Edit query definition").click();

    H.NativeEditor.get().should("be.visible").and("contain", query);
    cy.findByTestId("visualization-root")
      .findByText("Every field is hidden right now")
      .should("be.visible");
    cy.button("Save changes").should("be.disabled");
  });
});

describe("issue 23449", () => {
  const questionDetails = { query: { "source-table": REVIEWS_ID, limit: 2 } };
  function turnIntoModel() {
    cy.intercept("PUT", "/api/card/*").as("cardUpdate");

    H.openQuestionActions();
    cy.findByText("Turn into a model").click();
    cy.findByText("Turn this into a model").click();

    cy.wait("@cardUpdate").then(({ response }) => {
      expect(response.body.error).to.not.exist;
    });
  }

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();

    cy.request("POST", `/api/field/${REVIEWS.RATING}/dimension`, {
      type: "internal",
      name: "Rating",
    });

    cy.request("POST", `/api/field/${REVIEWS.RATING}/values`, {
      values: [
        [1, "Awful"],
        [2, "Unpleasant"],
        [3, "Meh"],
        [4, "Enjoyable"],
        [5, "Perfecto"],
      ],
    });
  });

  it("should work with the remapped custom values from data model (metabase#23449)", () => {
    H.createQuestion(questionDetails, { visitQuestion: true });
    cy.findByTextEnsureVisible("Perfecto");

    turnIntoModel();
    cy.findByTextEnsureVisible("Perfecto");
  });
});

describe("issue 25537", () => {
  const questionDetails = {
    name: "Orders model",
    query: { "source-table": ORDERS_ID },
    type: "model",
  };
  const setLocale = (locale) => {
    cy.request("GET", "/api/user/current").then(({ body: { id: user_id } }) => {
      cy.request("PUT", `/api/user/${user_id}`, { locale });
    });
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
    cy.intercept("GET", "/api/collection/*/items?*").as("getCollectionContent");
  });

  it("should be able to pick a saved model when using a non-english locale (metabase#25537)", () => {
    setLocale("de");
    H.createQuestion(questionDetails);

    H.startNewQuestion();
    H.entityPickerModal().within(() => {
      H.entityPickerModalTab("Sammlungen").click();
      cy.wait("@getCollectionContent");
      cy.findByText(questionDetails.name).should("exist");
    });
  });
});

describe("issue 26091", () => {
  const modelDetails = {
    name: "Old model",
    query: { "source-table": PRODUCTS_ID },
    type: "model",
  };

  const startNewQuestion = () => {
    cy.findByText("New").click();
    H.popover().within(() => cy.findByText("Question").click());
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
    cy.intercept("POST", "/api/card").as("saveQuestion");
  });

  it("should allow to choose a newly created model in the data picker (metabase#26091)", () => {
    H.createQuestion(modelDetails);
    cy.visit("/");

    startNewQuestion();
    H.entityPickerModal().within(() => {
      H.entityPickerModalTab("Tables").click();
      cy.findByText("Orders").click();
    });
    H.saveQuestion("New model", undefined, {
      tab: "Browse",
      path: ["Our analytics"],
    });
    turnIntoModel();

    startNewQuestion();
    H.entityPickerModal().within(() => {
      H.entityPickerModalTab("Collections").click();
      cy.findByText("New model").should("be.visible");
      cy.findByText("Old model").should("be.visible");
      cy.findByText("Orders Model").should("be.visible");
    });
  });
});

describe("issue 28193", () => {
  const ccName = "CTax";

  function assertOnColumns() {
    cy.findAllByText("2.07").should("be.visible").and("have.length", 2);
    // eslint-disable-next-line no-unsafe-element-filtering
    cy.findAllByTestId("header-cell")
      .should("be.visible")
      .last()
      .should("have.text", ccName);
  }

  beforeEach(() => {
    cy.intercept("POST", "/api/dataset").as("dataset");

    H.restore();
    cy.signInAsAdmin();

    // Turn the question into a model
    cy.request("PUT", `/api/card/${ORDERS_QUESTION_ID}`, { type: "model" });
  });

  it("should be able to use custom column in a model query (metabase#28193)", () => {
    // Go directly to model's query definition
    cy.visit(`/model/${ORDERS_QUESTION_ID}/query`);

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText("Custom column").click();
    H.enterCustomColumnDetails({
      formula: "[Tax]",
      name: ccName,
    });
    cy.button("Done").click();

    cy.findByTestId("run-button").click();
    cy.wait("@dataset");

    cy.button("Save changes").click();
    cy.location("pathname").should("not.include", "/query");

    assertOnColumns();

    cy.reload();
    cy.wait("@dataset");

    assertOnColumns();
  });
});

describe("issue 28971", () => {
  beforeEach(() => {
    H.restore();
    cy.signInAsNormalUser();
    cy.intercept("POST", "/api/card").as("createModel");
    cy.intercept("POST", "/api/dataset").as("dataset");
  });

  it("should be able to filter a newly created model (metabase#28971)", () => {
    H.startNewModel();
    H.entityPickerModal().within(() => {
      H.entityPickerModalTab("Tables").click();
      cy.findByText("Orders").click();
    });
    cy.findByTestId("run-button").click();
    cy.wait("@dataset");

    cy.findByTestId("dataset-edit-bar").button("Save").click();
    cy.findByTestId("save-question-modal").button("Save").click();
    cy.wait("@createModel");

    H.filter();
    H.popover().within(() => {
      cy.findByText("Quantity").click();
      cy.findByText("20").click();
      cy.button("Apply filter").click();
    });
    cy.wait("@dataset");

    cy.findByTestId("filter-pill").should(
      "have.text",
      "Quantity is equal to 20",
    );
    cy.findByTestId("question-row-count").should("have.text", "Showing 4 rows");
  });
});

describe("issue 29378", () => {
  const ACTION_DETAILS = {
    name: "Update orders quantity",
    description: "Set orders quantity to the same value",
    type: "query",
    model_id: ORDERS_QUESTION_ID,
    database_id: SAMPLE_DB_ID,
    dataset_query: {
      database: SAMPLE_DB_ID,
      native: {
        query: "UPDATE orders SET quantity = quantity",
      },
      type: "native",
    },
    parameters: [],
    visualization_settings: {
      type: "button",
    },
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
    H.setActionsEnabledForDB(SAMPLE_DB_ID);
  });

  it("should not crash the model detail page after searching for an action (metabase#29378)", () => {
    cy.request("PUT", `/api/card/${ORDERS_QUESTION_ID}`, { type: "model" });
    H.createAction(ACTION_DETAILS);

    cy.visit(`/model/${ORDERS_QUESTION_ID}/detail`);
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText(ACTION_DETAILS.name).should("be.visible");
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText(ACTION_DETAILS.dataset_query.native.query).should(
      "be.visible",
    );

    H.commandPaletteSearch(ACTION_DETAILS.name, false);
    H.commandPalette()
      .findByRole("option", { name: ACTION_DETAILS.name })
      .should("exist");
    H.closeCommandPalette();

    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText(ACTION_DETAILS.name).should("be.visible");
    // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
    cy.findByText(ACTION_DETAILS.dataset_query.native.query).should(
      "be.visible",
    );
  });
});

function mapModelColumnToDatabase({ table, field }) {
  cy.findByText("Database column this maps to")
    .parent()
    .findByTestId("select-button")
    .click();
  H.popover().findByRole("option", { name: table }).click();
  H.popover().findByRole("option", { name: field }).click();
  cy.contains(`${table} → ${field}`).should("be.visible");
  cy.findAllByDisplayValue(field);
  cy.findByLabelText("Description").should("not.be.empty");
}

function selectModelColumn(column) {
  cy.findAllByTestId("header-cell").contains(column).click();
}

describe("issue 29517 - nested question based on native model with remapped values", () => {
  const questionDetails = {
    name: "29517",
    type: "model",
    native: {
      query:
        'Select Orders."ID" AS "ID",\nOrders."CREATED_AT" AS "CREATED_AT"\nFrom Orders',
      "template-tags": {},
    },
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();

    H.createNativeQuestion(questionDetails).then(({ body: { id } }) => {
      cy.intercept("GET", `/api/database/${SAMPLE_DB_ID}/schema/PUBLIC`).as(
        "schema",
      );
      cy.visit(`/model/${id}/metadata`);
      cy.wait("@schema");

      mapModelColumnToDatabase({ table: "Orders", field: "ID" });
      selectModelColumn("CREATED_AT");
      mapModelColumnToDatabase({ table: "Orders", field: "Created At" });

      cy.intercept("PUT", "/api/card/*").as("updateModel");
      cy.button("Save changes").click();
      cy.wait("@updateModel");

      const nestedQuestionDetails = {
        query: {
          "source-table": `card__${id}`,
          aggregation: [["count"]],
          breakout: [
            [
              "field",
              "CREATED_AT",
              { "temporal-unit": "month", "base-type": "type/DateTime" },
            ],
          ],
        },
        display: "line",
      };

      H.createQuestionAndDashboard({
        questionDetails: nestedQuestionDetails,
      }).then(({ body: card }) => {
        const { card_id, dashboard_id } = card;

        H.editDashboardCard(card, {
          visualization_settings: {
            click_behavior: {
              type: "link",
              linkType: "dashboard",
              targetId: ORDERS_DASHBOARD_ID,
              parameterMapping: {},
            },
          },
        });

        cy.wrap(card_id).as("nestedQuestionId");
        cy.wrap(dashboard_id).as("dashboardId");
      });
    });
  });

  it("drill-through should work (metabase#29517-1)", () => {
    cy.intercept("POST", "/api/dataset").as("dataset");
    H.visitQuestion("@nestedQuestionId");

    // We can click on any circle; this index was chosen randomly
    H.cartesianChartCircle().eq(25).click({ force: true });
    H.popover()
      .findByText(/^See these/)
      .click();
    cy.wait("@dataset");

    cy.findByTestId("qb-filters-panel").findByText(
      "Created At is May 1–31, 2024",
    );

    H.assertQueryBuilderRowCount(520);
  });

  it("click behavior to custom destination should work (metabase#29517-2)", () => {
    cy.intercept("/api/dashboard/*/dashcard/*/card/*/query").as(
      "dashcardQuery",
    );

    H.visitDashboard("@dashboardId");

    cy.intercept("GET", `/api/dashboard/${ORDERS_DASHBOARD_ID}*`).as(
      "loadTargetDashboard",
    );
    H.cartesianChartCircle().eq(25).click({ force: true });
    cy.wait("@loadTargetDashboard");

    cy.location("pathname").should("eq", `/dashboard/${ORDERS_DASHBOARD_ID}`);

    cy.wait("@dashcardQuery");

    cy.get("[data-testid=cell-data]").contains("37.65");
  });
});

describe("issue 53556 - nested question based on native model with remapped values", () => {
  const questionDetails = {
    name: "53556",
    type: "model",
    native: {
      query:
        "Select " +
        'Orders."ID" AS "ID", ' +
        'Orders."CREATED_AT" AS "CREATED_AT_ALIAS", ' +
        'Orders."TOTAL" AS "TOTAL_ALIAS" ' +
        "From Orders",
      "template-tags": {},
    },
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();

    H.createNativeQuestion(questionDetails).then(({ body: { id } }) => {
      cy.intercept("GET", `/api/database/${SAMPLE_DB_ID}/schema/PUBLIC`).as(
        "schema",
      );
      cy.visit(`/model/${id}/metadata`);
      cy.wait("@schema");

      mapModelColumnToDatabase({ table: "Orders", field: "ID" });
      selectModelColumn("CREATED_AT_ALIAS");
      mapModelColumnToDatabase({ table: "Orders", field: "Created At" });
      selectModelColumn("TOTAL_ALIAS");
      mapModelColumnToDatabase({ table: "Orders", field: "Total" });

      cy.intercept("PUT", "/api/card/*").as("updateModel");
      cy.button("Save changes").click();
      cy.wait("@updateModel");

      const nestedQuestionDetails = {
        query: {
          "source-table": `card__${id}`,
          aggregation: [["count"]],
          breakout: [
            [
              "field",
              "CREATED_AT_ALIAS",
              { "temporal-unit": "month", "base-type": "type/DateTime" },
            ],
            [
              "field",
              "TOTAL_ALIAS",
              { binning: { strategy: "default" }, "base-type": "type/Float" },
            ],
          ],
        },
        display: "line",
      };

      H.createQuestion(nestedQuestionDetails, {
        wrapId: true,
        idAlias: "nestedQuestionId",
      });
    });
  });

  it("Underlying records drill-through should work (metabase#53556)", () => {
    cy.intercept("POST", "/api/dataset").as("dataset");
    H.visitQuestion("@nestedQuestionId");

    // We can click on any circle; this index was chosen randomly
    H.cartesianChartCircle().eq(25).click({ force: true });
    H.popover()
      .findByText(/^See these/)
      .click();
    cy.wait("@dataset");

    cy.findByTestId("qb-filters-panel").findByText(
      "Created At is May 1–31, 2024",
    );

    cy.findByTestId("qb-filters-panel").findByText(
      "Total is greater than or equal to 40",
    );

    cy.findByTestId("qb-filters-panel").findByText("Total is less than 60");

    H.assertQueryBuilderRowCount(110);
  });

  it("Zoom in binning drill-through should work (metabase#53556)", () => {
    cy.intercept("POST", "/api/dataset").as("dataset");
    H.visitQuestion("@nestedQuestionId");

    // We can click on any circle; this index was chosen randomly
    H.cartesianChartCircle().eq(25).click({ force: true });
    H.popover()
      .findByText(/^Zoom in/)
      .click();
    cy.wait("@dataset");

    cy.findByTestId("qb-filters-panel").findByText(
      "Total: 8 bins is greater than or equal to 40",
    );

    cy.findByTestId("qb-filters-panel").findByText(
      "Total: 8 bins is less than 60",
    );

    H.assertQueryBuilderRowCount(375);
  });

  it("Zoom in timeseries drill-through should work (metabase#53556)", () => {
    cy.intercept("POST", "/api/dataset").as("dataset");
    H.visitQuestion("@nestedQuestionId");

    // We can click on any circle; this index was chosen randomly
    H.cartesianChartCircle().eq(25).click({ force: true });
    H.popover()
      .findByText(/^See this month by week/)
      .click();
    cy.wait("@dataset");

    cy.findByTestId("qb-filters-panel").findByText(
      "Created At is May 1–31, 2024",
    );

    H.assertQueryBuilderRowCount(36);
  });

  it("Sort drill-through should work (metabase#53556)", () => {
    cy.intercept("POST", "/api/dataset").as("dataset");
    H.visitQuestion("@nestedQuestionId");

    cy.findByLabelText("Switch to data").click();
    H.assertQueryBuilderRowCount(312);

    cy.log("Sort by Total in descending order");
    H.tableHeaderClick("Total: 8 bins");
    H.popover()
      .findAllByTestId("click-actions-sort-control-sort.descending")
      .click();
    cy.wait("@dataset");
    H.assertQueryBuilderRowCount(312);
    H.assertTableData({
      columns: ["Created At: Month", "Total: 8 bins", "Count"],
      firstRows: [
        ["January 2024", "140  –  160", "18"],
        ["February 2024", "140  –  160", "17"],
      ],
    });

    cy.log("Sort by Total in ascending order");
    H.tableHeaderClick("Total: 8 bins");
    H.popover()
      .findAllByTestId("click-actions-sort-control-sort.ascending")
      .click();
    cy.wait("@dataset");
    H.assertQueryBuilderRowCount(312);
    H.assertTableData({
      columns: ["Created At: Month", "Total: 8 bins", "Count"],
      firstRows: [
        ["December 2023", "-60  –  -40", "1"],
        ["September 2022", "0  –  20", "2"],
      ],
    });

    cy.log("Sort by Created At in descending order");
    H.tableHeaderClick("Created At: Month");
    H.popover()
      .findAllByTestId("click-actions-sort-control-sort.descending")
      .click();
    cy.wait("@dataset");
    H.assertQueryBuilderRowCount(312);
    H.assertTableData({
      columns: ["Created At: Month", "Total: 8 bins", "Count"],
      firstRows: [
        ["April 2026", "20  –  40", "27"],
        ["April 2026", "40  –  60", "57"],
      ],
    });

    cy.log("Sort by Created At in ascending order");
    H.tableHeaderClick("Created At: Month");
    H.popover()
      .findAllByTestId("click-actions-sort-control-sort.ascending")
      .click();
    cy.wait("@dataset");
    H.assertQueryBuilderRowCount(312);
    H.assertTableData({
      columns: ["Created At: Month", "Total: 8 bins", "Count"],
      firstRows: [
        ["April 2022", "40  –  60", "1"],
        ["May 2022", "20  –  40", "1"],
      ],
    });
  });
});

describe("issue 52465 - model with linked columns can still be aggregated", () => {
  const questionDetails = {
    name: "52465",
    type: "model",
    native: {
      query: `
SELECT
  "ID" AS "id orders",
  "SOURCE" AS "source orders"
FROM
  "PEOPLE"
`,
      "template-tags": {},
    },
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
  });

  it("Create model, set metadata, distinct", () => {
    H.createNativeQuestion(questionDetails).then(({ body: { id } }) => {
      cy.intercept("GET", `/api/database/${SAMPLE_DB_ID}/schema/PUBLIC`).as(
        "schema",
      );
      cy.visit(`/model/${id}/metadata`);
      cy.wait("@schema");

      selectModelColumn("source orders");
      mapModelColumnToDatabase({ table: "People", field: "Source" });

      cy.intercept("PUT", "/api/card/*").as("updateModel");
      cy.button("Save changes").click();
      cy.wait("@updateModel");

      const nestedQuestionDetails = {
        query: {
          "source-table": `card__${id}`,
        },
      };

      H.createQuestion(nestedQuestionDetails, {
        wrapId: true,
        idAlias: "nestedQuestionId",
      });

      H.visitQuestion("@nestedQuestionId");
      cy.findByText("Source").click();
      cy.findByText("Distinct values").click();

      H.assertQueryBuilderRowCount(1);
    });
  });
});

describe("issue 53604 - nested native question with multiple breakouts on same column", () => {
  const questionDetails = {
    name: "53604 base",
    type: "question",
    native: {
      query: "select ID, CREATED_AT from ORDERS",
      "template-tags": {},
    },
  };

  function createNestedQuestion({
    turnIntoModel: shouldTurnIntoModel = false,
  } = {}) {
    H.createNativeQuestion(questionDetails).then(({ body: { id } }) => {
      if (shouldTurnIntoModel) {
        H.visitQuestion(id);
        turnIntoModel();
      }
      H.createQuestion(
        {
          type: "question",
          name: "53604",
          query: {
            "source-table": `card__${id}`,
            aggregation: [["count"]],
            breakout: [
              [
                "field",
                "CREATED_AT",
                { "temporal-unit": "month", "base-type": "type/DateTime" },
              ],
              [
                "field",
                "CREATED_AT",
                { "temporal-unit": "year", "base-type": "type/DateTime" },
              ],
            ],
          },
          display: "line",
        },
        {
          wrapId: true,
          idAlias: "nestedQuestionId",
        },
      );
    });
  }

  function testUnderlyingRecordsDrillThru() {
    cy.intercept("POST", "/api/dataset").as("dataset");
    H.visitQuestion("@nestedQuestionId");

    // We can click on any circle; this index was chosen randomly
    H.cartesianChartCircle().eq(25).click({ force: true });
    H.popover()
      .findByText(/^See these/)
      .click();
    cy.wait("@dataset");

    cy.findByTestId("qb-filters-panel").findByText(
      "CREATED_AT is May 1–31, 2024",
    );

    cy.findByTestId("qb-filters-panel").findByText(
      "CREATED_AT is Jan 1 – Dec 31, 2024",
    );

    H.assertQueryBuilderRowCount(520);
  }

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
  });

  it("Underlying records drill-through should work on nested native question (metabase#53604)", () => {
    createNestedQuestion();
    testUnderlyingRecordsDrillThru();
  });

  it("Underlying records drill-through should work on nested native model (metabase#53604)", () => {
    createNestedQuestion({ turnIntoModel: true });
    testUnderlyingRecordsDrillThru();
  });
});

describe("issue 54108 - nested question broken out by day", () => {
  const questionDetails = {
    name: "54108 base",
    type: "question",
    native: {
      query: "select ID, CREATED_AT from ORDERS",
      "template-tags": {},
    },
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();

    H.createNativeQuestion(questionDetails).then(({ body: { id } }) => {
      H.createQuestion(
        {
          type: "question",
          name: "54108",
          query: {
            "source-table": `card__${id}`,
            aggregation: [["count"]],
            breakout: [
              [
                "field",
                "CREATED_AT",
                { "temporal-unit": "day", "base-type": "type/Date" },
              ],
            ],
          },
          display: "line",
        },
        {
          wrapId: true,
          idAlias: "nestedQuestionId",
        },
      );
    });
  });

  it("drill-through should work (metabase#54108)", () => {
    cy.intercept("POST", "/api/dataset").as("dataset");
    H.visitQuestion("@nestedQuestionId");

    // We can click on any circle; this index was chosen randomly
    H.cartesianChartCircle().eq(500).click({ force: true });
    H.popover()
      .findByText(/^See these/)
      .click();
    cy.wait("@dataset");

    cy.findByTestId("qb-filters-panel").findByText(
      "CREATED_AT is Oct 11, 2023",
    );

    H.assertQueryBuilderRowCount(6);
  });
});

describe("issue 29951", { requestTimeout: 10000, viewportWidth: 1600 }, () => {
  const questionDetails = {
    name: "29951",
    query: {
      "source-table": ORDERS_ID,
      expressions: {
        CC1: ["+", ["field", ORDERS.TOTAL], 1],
        CC2: ["+", ["field", ORDERS.TOTAL], 1],
      },
      limit: 2,
    },
    type: "model",
  };
  const removeExpression = (name) => {
    H.getNotebookStep("expression")
      .findByText(name)
      .findByLabelText("close icon")
      .click();
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
    cy.intercept("PUT", "/api/card/*").as("updateCard");
  });

  it("should allow to run the model query after changing custom columns (metabase#29951)", () => {
    H.createQuestion(questionDetails).then(({ body: { id } }) => {
      cy.visit(`/model/${id}/query`);
    });

    removeExpression("CC2");
    // The UI shows us the "play" icon, indicating we should refresh the query,
    // but the point of this repro is to save without refreshing
    cy.button("Get Answer").should("be.visible");
    H.saveMetadataChanges();

    // eslint-disable-next-line no-unsafe-element-filtering
    cy.findAllByTestId("header-cell").last().should("have.text", "CC1");
    H.tableHeaderColumn("ID").as("idHeader");
    H.moveDnDKitElementByAlias("@idHeader", { horizontal: 100 });

    cy.findByTestId("qb-header").button("Refresh").click();
    cy.wait("@dataset");
    cy.get("[data-testid=cell-data]").should("contain", "37.65");
    cy.findByTestId("view-footer").should("contain", "Showing 2 rows");
  });
});

describe("issue 31309", () => {
  const TEST_QUERY = {
    "order-by": [["asc", ["field", "sum", { "base-type": "type/Float" }]]],
    limit: 10,
    filter: ["<", ["field", "sum", { "base-type": "type/Float" }], 100],
    "source-query": {
      "source-table": ORDERS_ID,
      aggregation: [["sum", ["field", ORDERS.TOTAL, null]]],
      breakout: [
        [
          "field",
          PEOPLE.NAME,
          { "base-type": "type/Text", "source-field": ORDERS.USER_ID },
        ],
      ],
    },
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
  });

  it("should duplicate a model with its original aggregation and breakout", () => {
    H.createQuestion(
      {
        name: "model",
        query: TEST_QUERY,
        database: SAMPLE_DB_ID,
        type: "model",
      },
      {
        visitQuestion: true,
      },
    );

    H.openQuestionActions();
    H.popover().findByText("Duplicate").click();

    H.modal().within(() => {
      cy.findByText("Duplicate").click();
    });

    H.openQuestionActions();
    H.popover().within(() => {
      cy.findByText("Edit query definition").click();
    });

    cy.findByTestId("data-step-cell").findByText("Orders").should("exist");

    cy.findByTestId("aggregate-step")
      .findByText("Sum of Total")
      .should("exist");

    cy.findByTestId("breakout-step").findByText("User → Name").should("exist");

    H.getNotebookStep("filter", { stage: 1, index: 0 })
      .findByText("Sum of Total is less than 100")
      .should("exist");

    H.getNotebookStep("sort", { stage: 1, index: 0 })
      .findByText("Sum of Total")
      .should("exist");

    H.getNotebookStep("limit", { stage: 1, index: 0 })
      .findByDisplayValue("10")
      .should("exist");
  });
});

// Should be removed once proper model FK support is implemented
describe("issue 31663", () => {
  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();

    cy.intercept("POST", "/api/dataset").as("dataset");
    cy.intercept("GET", `/api/database/${SAMPLE_DB_ID}/idfields`).as(
      "idFields",
    );

    H.createQuestion(
      {
        name: "Products Model",
        type: "model",
        query: { "source-table": PRODUCTS_ID },
      },
      { visitQuestion: true },
    );
  });

  it("shouldn't list model IDs as possible model FK targets (metabase#31663)", () => {
    // It's important to have product model's metadata loaded to reproduce this
    H.appBar().findByText("Our analytics").click();

    H.main().findByText("Orders Model").click();
    cy.wait("@dataset");
    cy.findByLabelText("Move, trash, and more…").click();
    H.popover().findByText("Edit metadata").click();

    H.tableInteractive().findByText("Product ID").click();
    cy.wait("@idFields");
    cy.findByPlaceholderText("Select a target").click();
    H.popover().findByText("Orders Model → ID").should("not.exist");
    H.popover().findByText("Products Model → ID").should("not.exist");

    H.popover().findByText("Orders → ID").should("be.visible");
    H.popover().findByText("People → ID").should("be.visible");
    H.popover().findByText("Products → ID").should("be.visible");
    H.popover()
      .scrollTo("bottom")
      .findByText("Reviews → ID")
      .should("be.visible");
  });
});

describe("issue 31905", () => {
  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();

    cy.intercept("GET", "/api/card/*").as("card");

    H.createQuestion(
      {
        name: "Orders Model",
        type: "model",
        query: { "source-table": ORDERS_ID, limit: 2 },
      },
      { visitQuestion: true },
    );
  });

  // TODO: This should be 1, but MainNavbar.tsx RTKQ fetch + QB's call to loadCard makes it 2
  it("should not send more than one same api requests to load a model (metabase#31905)", () => {
    cy.get("@card.all").should("have.length.lte", 2);
  });
});

describe("issue 32483", () => {
  const createTextFilterMapping = ({ card_id, fieldRef }) => {
    return {
      card_id,
      parameter_id: DASHBOARD_FILTER_TEXT.id,
      target: ["dimension", fieldRef],
    };
  };
  const DASHBOARD_FILTER_TEXT = createMockActionParameter({
    id: "1",
    name: "Text filter",
    slug: "filter-text",
    type: "string/=",
    sectionId: "string",
  });

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
  });

  it("dashboard filter should be applied to the saved model with source containing custom column (metabase#32483)", () => {
    const questionDetails = {
      query: {
        "source-table": PEOPLE_ID,
        expressions: {
          "source state": [
            "concat",
            [
              "field",
              PEOPLE.SOURCE,
              {
                "base-type": "type/Text",
              },
            ],
            " ",
            [
              "field",
              PEOPLE.STATE,
              {
                "base-type": "type/Text",
              },
            ],
          ],
        },
      },
    };

    H.createQuestion(questionDetails, { wrapId: true });

    cy.get("@questionId").then((questionId) => {
      const modelDetails = {
        type: "model",
        name: "Orders + People Question Model",
        query: {
          "source-table": ORDERS_ID,
          joins: [
            {
              fields: "all",
              alias: "People - User",
              condition: [
                "=",
                [
                  "field",
                  ORDERS.USER_ID,
                  {
                    "base-type": "type/Integer",
                  },
                ],
                [
                  "field",
                  "ID",
                  {
                    "base-type": "type/BigInteger",
                    "join-alias": "People - User",
                  },
                ],
              ],
              "source-table": `card__${questionId}`,
            },
          ],
        },
      };

      H.createQuestion(modelDetails).then(({ body: { id: modelId } }) => {
        const dashboardDetails = {
          name: "32483 Dashboard",
          parameters: [DASHBOARD_FILTER_TEXT],
          dashcards: [
            createMockDashboardCard({
              id: 1,
              size_x: 8,
              size_y: 8,
              card_id: questionId,
              parameter_mappings: [
                createTextFilterMapping({
                  card_id: questionId,
                  fieldRef: [
                    "expression",
                    "source state",
                    {
                      "base-type": "type/Text",
                    },
                  ],
                }),
              ],
            }),
            createMockDashboardCard({
              id: 2,
              size_x: 8,
              size_y: 8,
              card_id: modelId,
              parameter_mappings: [
                createTextFilterMapping({
                  card_id: modelId,
                  fieldRef: [
                    "field",
                    "source state",
                    {
                      "base-type": "type/Text",
                      "join-alias": "People - User",
                    },
                  ],
                }),
              ],
            }),
          ],
        };

        H.createDashboard(dashboardDetails).then(
          ({ body: { id: dashboardId } }) => {
            H.visitDashboard(dashboardId);
          },
        );
      });
    });

    H.filterWidget().click();
    addWidgetStringFilter("Facebook MN");

    H.getDashboardCard(1).should("contain", "Orders + People Question Model");
  });
});

describe("issue 32963", () => {
  function assertLineChart() {
    H.openVizTypeSidebar();
    H.leftSidebar().within(() => {
      cy.findByTestId("Line-container").should(
        "have.attr",
        "aria-selected",
        "true",
      );
      cy.findByTestId("Table-container").should(
        "have.attr",
        "aria-selected",
        "false",
      );
    });
  }

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
    H.createQuestion(
      {
        name: "Orders Model",
        type: "model",
        query: { "source-table": ORDERS_ID },
      },
      { visitQuestion: true },
    );
  });

  it("should pick sensible display for model based questions (metabase#32963)", () => {
    cy.findByTestId("qb-header")
      .button(/Summarize/)
      .click();
    cy.intercept("POST", "/api/dataset").as("dataset");

    H.rightSidebar().within(() => {
      cy.findAllByText("Created At").eq(0).click();
      cy.button("Done").click();
    });
    cy.wait("@dataset");
    assertLineChart();

    // Go back to the original model
    cy.findByTestId("qb-header").findByText("Orders Model").click();
    H.openNotebook();

    cy.button("Summarize").click();
    H.popover().findByText("Count of rows").click();
    H.getNotebookStep("summarize")
      .findByText("Pick a column to group by")
      .click();
    H.popover().findByText("Created At").click();
    H.visualize();
    assertLineChart();
  });
});

describe("issues 35039 and 37009", () => {
  // We only need to ensure there is a comment. Any comment.
  const query = "select * from products limit 1 -- foo";

  const cardDetails = {
    name: "35039",
    type: "model",
    native: { query },
    visualization_settings: {},
  };

  beforeEach(() => {
    H.restore();
    cy.intercept("POST", "/api/dataset").as("dataset");
    cy.signInAsNormalUser();

    H.createNativeQuestion(cardDetails).then(({ body: { id } }) => {
      // It is crucial for this repro to go directly to the "edit query definition" page!
      // When the repro was created back in v47-v48, it was still possible to save a new model
      // without running the query first. This resulted in the missing `result_metadata`.
      // It's not possible to replicate that using UI anymore, so our best bet is to create a model
      // using API, and then to visit this page directly.
      cy.visit(`/model/${id}/query`);
    });
    assertResultsLoaded();
  });

  // This test follows #37009 repro steps because they are simpler than #35039 but still equivalent
  it("should show columns available in the model (metabase#35039) (metabase#37009)", () => {
    // The repro requires that we update the query in a minor, non-impactful way.
    cy.log("Update the query and save");
    H.NativeEditor.focus().type("{backspace}");
    cy.findByTestId("native-query-editor-container").icon("play").click();
    cy.wait("@dataset");

    cy.findByTestId("dataset-edit-bar").within(() => {
      cy.button("Save changes").click();
      cy.button("Saving…").should("not.exist");
    });

    assertResultsLoaded();

    cy.log("Start new ad-hoc question and make sure all columns are there");
    H.openNotebook();
    cy.findByTestId("fields-picker").click();
    H.popover().within(() => {
      cy.findByText("ID").should("exist");
      cy.findByText("EAN").should("exist");
      cy.findByText("TITLE").should("exist");
      cy.findByText("CATEGORY").should("exist");
      cy.findByText("VENDOR").should("exist");
      cy.findByText("PRICE").should("exist");
      cy.findByText("RATING").should("exist");
      cy.findByText("CREATED_AT").should("exist");
    });
  });

  function assertResultsLoaded() {
    cy.findAllByTestId("cell-data").should("contain", "Rustic Paper Wallet");
  }
});

describe("issue 37009", () => {
  beforeEach(() => {
    H.restore();
    cy.intercept("POST", "/api/dataset").as("dataset");
    cy.intercept("POST", "/api/card").as("saveCard");
    cy.intercept("PUT", "/api/card/*").as("updateCard");
    cy.signInAsNormalUser();
  });

  it("should prevent saving new and updating existing models without result_metadata (metabase#37009)", () => {
    H.startNewNativeModel({ query: "select * from products" });

    cy.findByTestId("dataset-edit-bar")
      .button("Save")
      .should("be.disabled")
      .trigger("mousemove", { force: true });
    cy.findByRole("tooltip").should(
      "have.text",
      "You must run the query before you can save this model",
    );
    cy.findByTestId("native-query-editor-container").icon("play").click();
    cy.wait("@dataset");
    cy.findByRole("tooltip").should("not.exist");
    cy.findByTestId("dataset-edit-bar")
      .button("Save")
      .should("be.enabled")
      .click();
    // eslint-disable-next-line no-unsafe-element-filtering
    H.modal()
      .last()
      .within(() => {
        cy.findByLabelText("Name").type("Model");
        cy.button("Save").click();
      });
    cy.wait("@saveCard")
      .its("request.body")
      .its("result_metadata")
      .should("not.be.null");

    H.openQuestionActions();
    H.popover().findByText("Edit query definition").click();
    H.NativeEditor.focus().type(" WHERE CATEGORY = 'Gadget'");
    cy.findByTestId("dataset-edit-bar")
      .button("Save changes")
      .should("be.disabled")
      .trigger("mousemove", { force: true });
    cy.findByRole("tooltip").should(
      "have.text",
      "You must run the query before you can save this model",
    );
    cy.findByTestId("native-query-editor-container").icon("play").click();
    cy.wait("@dataset");
    cy.findByRole("tooltip").should("not.exist");
    cy.findByTestId("dataset-edit-bar")
      .button("Save changes")
      .should("be.enabled")
      .click();
    cy.wait("@updateCard")
      .its("request.body")
      .its("result_metadata")
      .should("not.be.null");
  });
});

describe("issue 40252", () => {
  const modelA = {
    name: "Model A",
    native: { query: "select 1 as a1, 2 as a2" },
    type: "model",
  };

  const modelB = {
    name: "Model B",
    native: { query: "select 1 as b1, 2 as b2" },
    type: "model",
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();
  });

  it("shouldn't crash during save of metadata (metabase#40252)", () => {
    H.createNativeQuestion(modelA, { wrapId: true, idAlias: "modelA" });
    H.createNativeQuestion(modelB, { wrapId: true, idAlias: "modelB" });

    cy.get("@modelA").then((modelAId) => {
      cy.get("@modelB").then((modelBId) => {
        const questionDetails = {
          name: "40252",
          type: "model",
          query: {
            joins: [
              {
                fields: "all",
                alias: "Model B - A1",
                strategy: "inner-join",
                condition: [
                  "=",
                  [
                    "field",
                    "A1",
                    {
                      "base-type": "type/Integer",
                    },
                  ],
                  [
                    "field",
                    "B1",
                    {
                      "base-type": "type/Integer",
                      "join-alias": "Model B - A1",
                    },
                  ],
                ],
                "source-table": `card__${modelBId}`,
              },
            ],
            "source-table": `card__${modelAId}`,
          },
        };

        H.createQuestion(questionDetails, { visitQuestion: true });
      });
    });

    H.openQuestionActions();

    H.popover().findByText("Edit metadata").click();

    cy.findAllByTestId("header-cell").contains("Model B - A1 → B1").click();
    cy.findByLabelText("Display name").type("Upd");

    //Because the field is debounced, we wait to see it in the metadata editor table before saving
    cy.findAllByTestId("header-cell").contains("Model B - A1 → B1Upd");
    cy.intercept("POST", "/api/dataset").as("dataset");

    cy.findByTestId("dataset-edit-bar")
      .findByRole("button", { name: "Save changes" })
      .should("be.enabled")
      .click();

    cy.url().should("not.contain", "/metadata");

    cy.wait("@dataset");

    cy.findAllByTestId("header-cell").contains("Model B - A1 → B1Upd");
  });
});

describe("issue 42355", () => {
  beforeEach(() => {
    H.restore();
    cy.signInAsNormalUser();
  });

  it("should allow overriding database fields for models with manually ordered columns (metabase#42355)", () => {
    H.createNativeQuestion({
      type: "model",
      native: { query: "SELECT ID, PRODUCT_ID FROM ORDERS" },
      visualization_settings: {
        "table.columns": [
          {
            name: "PRODUCT_ID",
            key: '["name","PRODUCT_ID"]',
            enabled: true,
            fieldRef: ["field", "PRODUCT_ID", { "base-type": "type/Integer" }],
          },
          {
            name: "ID",
            key: '["name","ID"]',
            enabled: true,
            fieldRef: ["field", "ID", { "base-type": "type/BigInteger" }],
          },
        ],
        "table.cell_column": "ID",
      },
    }).then(({ body: card }) => H.visitModel(card.id));

    cy.log("update metadata");
    H.openQuestionActions();
    H.popover().findByText("Edit metadata").click();
    H.rightSidebar()
      .findByText("Database column this maps to")
      .next()
      .findByText("None")
      .click();
    H.popover().within(() => {
      cy.findByText("Orders").click();
      cy.findByText("ID").click();
    });
    cy.button("Save changes").click();

    cy.log("check metadata changes are visible");
    H.openQuestionActions();
    H.popover().findByText("Edit metadata").click();
    H.rightSidebar()
      .findByText("Database column this maps to")
      .next()
      .findByText("Orders → ID")
      .should("be.visible");
  });
});

describe("cumulative count - issue 33330", () => {
  const questionDetails = {
    name: "33330",
    query: {
      "source-table": ORDERS_ID,
      aggregation: [["cum-count"]],
      breakout: [["field", ORDERS.CREATED_AT, { "temporal-unit": "month" }]],
    },
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsAdmin();

    H.createQuestion(questionDetails, { visitQuestion: true });
    cy.findAllByTestId("header-cell")
      .should("contain", "Created At: Month")
      .and("contain", "Cumulative count");
    cy.findAllByTestId("cell-data").should("contain", "June 2022");
  });

  it("should still work after turning a question into model (metabase#33330-1)", () => {
    turnIntoModel();
    cy.findAllByTestId("header-cell")
      .should("contain", "Created At: Month")
      .and("contain", "Cumulative count");
    cy.findAllByTestId("cell-data").should("contain", "June 2022");
  });

  it("should still work after applying a post-aggregation filter (metabase#33330-2)", () => {
    cy.intercept("POST", "/api/dataset").as("dataset");
    H.filter();
    H.popover().within(() => {
      cy.findByText("Created At").click();
      cy.findByText("Today").click();
    });
    cy.wait("@dataset");

    cy.findByTestId("filter-pill").should("have.text", "Created At is today");
    cy.findAllByTestId("header-cell")
      .should("contain", "Created At: Month")
      .and("contain", "Cumulative count");
    cy.findAllByTestId("cell-data")
      .should("have.length", "4")
      .and("not.be.empty");
    cy.findByTestId("question-row-count").should("have.text", "Showing 1 row");
  });
});

describe("issue 45926", () => {
  const questionDetails = {
    name: "33330",
    type: "model",
    query: {
      "source-table": ORDERS_ID,
    },
  };

  beforeEach(() => {
    H.restore();
    cy.signInAsNormalUser();

    cy.intercept("POST", "/api/dataset").as("dataset");
  });

  it("should restore model correctly without refresh (metabase#45926)", () => {
    H.createQuestion(questionDetails, { visitQuestion: true });
    cy.wait("@dataset");
    H.openQuestionActions("Edit metadata");
    H.sidebar().within(() => {
      cy.findByDisplayValue("ID").type(" updated");
    });

    cy.button("Save changes").click();
    cy.wait("@dataset");

    cy.findByRole("columnheader", { name: "ID updated" }).should("be.visible");
    H.openQuestionActions("Edit query definition");
    cy.button("Sort").click();
    H.popover().findByText("ID").click();
    cy.button("Save changes").click();
    cy.wait("@dataset");

    H.questionInfoButton().click();
    H.sidesheet().within(() => {
      cy.findByRole("tab", { name: "History" }).click();
      cy.findByText(
        "changed the visualization settings and edited the metadata.",
      )
        .closest("li")
        .findByTestId("question-revert-button")
        .click();
    });

    cy.wait("@dataset");

    H.sidesheet().button("Close").click();

    cy.findByRole("columnheader", { name: "ID updated" }).should("be.visible");
  });
});
