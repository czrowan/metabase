---
title: Metabase documentation
redirect_from:
  - /docs/latest/enterprise-guide
  - /docs/latest/users-guide
  - /docs/latest/administration-guide
  - /docs/latest/operations-guide
  - /docs/latest/faq
---

# Metabase documentation

![Metabase dashboard](./images/metabase-product-screenshot.png)

Metabase is an open-source business intelligence platform. You can use Metabase to ask questions about your data, or embed Metabase in your app to let your customers explore their data on their own.

## First steps

### Metabase Cloud

The easiest way to get started with Metabase is to sign up for a free trial of [Metabase Cloud](https://store.metabase.com/checkout). You get support, backups, upgrades, an SMTP server, SSL certificate, SoC2 Type 2 security auditing, and more (plus your money goes toward improving Metabase). Check out our quick overview of [cloud vs self-hosting](./cloud/cloud-vs-self-hosting.md). If you need to, you can always switch to [self-hosting](./installation-and-operation/installing-metabase.md) Metabase at any time (or vice versa).

### [Installing Metabase](./installation-and-operation/installing-metabase.md)

Run as a JAR, using Docker, or on [Metabase Cloud](https://store.metabase.com/checkout).

### [Setting up Metabase](./configuring-metabase/setting-up-metabase.md)

Once installed, set up your Metabase and connect to your data.

### [Getting started](https://www.metabase.com/learn/metabase-basics/getting-started/index)

With your data connected, get started asking questions, creating dashboards, and sharing your work.

### [A tour of Metabase](https://www.metabase.com/learn/metabase-basics/overview/tour-of-metabase)

Metabase is a deep product with a lot of tools to simplify business intelligence, from embeddable charts and interactive dashboards, to GUI and SQL editors, to auditing and row and column security, and more.

## Documentation topics

Metabase's reference documentation.

### Installation

- [Installation overview](./installation-and-operation/start.md)
- [Installing Metabase](./installation-and-operation/installing-metabase.md)
- [Upgrading Metabase](./installation-and-operation/upgrading-metabase.md)
- [Configuring the Metabase application database](./installation-and-operation/configuring-application-database.md)
- [Backing up Metabase](./installation-and-operation/backing-up-metabase-application-data.md)
- [Migrating to a production application database](./installation-and-operation/migrating-from-h2.md)
- [Monitoring your Metabase](./installation-and-operation/monitoring-metabase.md)
- [Development instances](./installation-and-operation/development-instance.md)
- [Serialization](./installation-and-operation/serialization.md)
- [Commands](./installation-and-operation/commands.md)
- [Supported browsers](./installation-and-operation/supported-browsers.md)
- [Privacy](./installation-and-operation/privacy.md)
- [About the anonymous usage data we collect](./installation-and-operation/information-collection.md)

### Databases

- [Databases overview](./databases/start.md)
- [Adding and managing databases](./databases/connecting.md)
- [Database users, roles, and privileges](./databases/users-roles-privileges.md)
- [Syncing and scanning databases](./databases/sync-scan.md)
- [Encrypting your database connection](./databases/encrypting-details-at-rest.md)
- [SSH tunneling](./databases/ssh-tunnel.md)
- [SSL certificate](./databases/ssl-certificates.md)
- [Uploading data](./databases/uploads.md)

### Questions

- [Questions overview](./questions/start.md)
- [Alerts](./questions/alerts.md)
- [Exporting data](./questions/exporting-results.md)

#### Query builder

- [The query editor](./questions/query-builder/editor.md)
- [Filtering](./questions/query-builder/filters.md)
- [Summarizing and grouping](./questions/query-builder/summarizing-and-grouping.md)
- [Custom expressions](./questions/query-builder/expressions.md)
- [List of expressions](./questions/query-builder/expressions-list.md)
- [Joining data](./questions/query-builder/join.md)

#### SQL and native queries

- [The SQL editor](./questions/native-editor/writing-sql.md)
- [SQL parameters](./questions/native-editor/sql-parameters.md)
- [Referencing models and saved questions](./questions/native-editor/referencing-saved-questions-in-queries.md)
- [Snippets](./questions/native-editor/snippets.md)
- [Snippet folder permissions](./permissions/snippets.md)

#### Visualizing data

- [Visualizing data](./questions/visualizations/visualizing-results.md)
- [Combo charts](./questions/visualizations/combo-chart.md)
- [Detail](./questions/visualizations/detail.md)
- [Funnel charts](./questions/visualizations/funnel.md)
- [Gauge charts](./questions/visualizations/gauge.md)
- [Line, bar, and area charts](./questions/visualizations/line-bar-and-area-charts.md)
- [Maps](./questions/visualizations/map.md)
- [Numbers](./questions/visualizations/numbers.md)
- [Pie or donut charts](./questions/visualizations/pie-or-donut-chart.md)
- [Pivot table](./questions/visualizations/pivot-table.md)
- [Progress bar](./questions/visualizations/progress-bar.md)
- [Sankey chart](./questions/visualizations/sankey.md)
- [Scatterplot or bubble chart](./questions/visualizations/scatterplot-or-bubble-chart.md)
- [Table](./questions/visualizations/table.md)
- [Tooltips](./questions/visualizations/tooltips.md)
- [Trend](./questions/visualizations/trend.md)
- [Waterfall chart](./questions/visualizations/waterfall-chart.md)

### Dashboards

- [Dashboards overview](./dashboards/start.md)
- [Introduction to dashboards](./dashboards/introduction.md)
- [Dashboard filters](./dashboards/filters.md)
- [Interactive dashboards](./dashboards/interactive.md)
- [Charts with multiple series](./dashboards/multiple-series.md)
- [Dashboard subscriptions](./dashboards/subscriptions.md)
- [Actions on dashboards](./dashboards/actions.md)

### Data modeling

- [Data modeling overview](./data-modeling/start.md)
- [Models](./data-modeling/models.md)
- [Model persistence](./data-modeling/model-persistence.md)
- [Metrics](./data-modeling/metrics.md)
- [Table metadata admin settings](./data-modeling/metadata-editing.md)
- [Field types](./data-modeling/semantic-types.md)
- [Formatting defaults](./data-modeling/formatting.md)
- [Working with JSON](./data-modeling/json-unfolding.md)
- [Segments](./data-modeling/segments.md)

### Actions

- [Actions overview](./actions/start.md)
- [Introduction to actions](./actions/introduction.md)
- [Basic actions](./actions/basic.md)
- [Custom actions](./actions/custom.md)

### Exploration and organization

- [Organization overview](./exploration-and-organization/start.md)
- [Basic exploration](./exploration-and-organization/exploration.md)
- [Collections](./exploration-and-organization/collections.md)
- [Keyboard shortcuts](./exploration-and-organization/keyboard-shortcuts.md)
- [History](./exploration-and-organization/history.md)
- [Trash](./exploration-and-organization/delete-and-restore.md)
- [Data reference](./exploration-and-organization/data-model-reference.md)
- [Events and timelines](./exploration-and-organization/events-and-timelines.md)
- [X-rays](./exploration-and-organization/x-rays.md)
- [Content verification](./exploration-and-organization/content-verification.md)

### People

- [People overview](./people-and-groups/start.md)
- [Account settings](./people-and-groups/account-settings.md)
- [Managing people and groups](./people-and-groups/managing.md)
- [Password complexity](./people-and-groups/changing-password-complexity.md)
- [Session expiration](./people-and-groups/changing-session-expiration.md)
- [Google Sign-In](./people-and-groups/google-sign-in.md)
- [LDAP](./people-and-groups/ldap.md)
- [API keys](./people-and-groups/api-keys.md)

#### Paid SSO options

- [JWT-based authentication](./people-and-groups/authenticating-with-jwt.md)
- [SAML-based authentication](./people-and-groups/authenticating-with-saml.md)
  - [SAML with Auth0](./people-and-groups/saml-auth0.md)
  - [SAML with Microsoft Entra ID](./people-and-groups/saml-azure.md)
  - [SAML with Google](./people-and-groups/saml-google.md)
  - [SAML with Keycloak](./people-and-groups/saml-keycloak.md)
  - [SAML with Okta](./people-and-groups/saml-okta.md)
- [User provisioning with SCIM](./people-and-groups/user-provisioning.md)

### Permissions

- [Permissions overview](./permissions/start.md)
- [Permissions introduction](./permissions/introduction.md)
- [Data permissions](./permissions/data.md)
- [Collection permissions](./permissions/collections.md)
- [Application permissions](./permissions/application.md)
- [Row and column security](./permissions/row-and-column-security.md)
- [Row and column security examples](./permissions/row-and-column-security-examples.md)
- [Connection impersonation](./permissions/impersonation.md)
- [Database routing](./permissions/database-routing.md)
- [Snippets folder permissions](./permissions/snippets.md)
- [Notification permissions](./permissions/notifications.md)
- [Configuring permissions for embedding](./permissions/embedding.md)

### Embedding

- [Embedding overview](./embedding/start.md)
- [Embedding introduction](./embedding/introduction.md)
- [Interactive embedding](./embedding/interactive-embedding.md)
- [Interactive embedding quick start](./embedding/interactive-embedding-quick-start-guide.md)
- [Static embedding](./embedding/static-embedding.md)
- [Parameters for static embeds](./embedding/static-embedding-parameters.md)
- [Securing embedded Metabase](./embedding/securing-embeds.md)

### Configuration

- [Configuration overview](./configuring-metabase/start.md)
- [Setting up Metabase](./configuring-metabase/setting-up-metabase.md)
- [General settings](./configuring-metabase/settings.md)
- [Email](./configuring-metabase/email.md)
- [Slack](./configuring-metabase/slack.md)
- [Webhooks](./configuring-metabase/webhooks.md)
- [Environment variables](./configuring-metabase/environment-variables.md)
- [Configuration file](./configuring-metabase/config-file.md)
- [Metabase log configuration](./configuring-metabase/log-configuration.md)
- [Timezones](./configuring-metabase/timezones.md)
- [Languages and localization](./configuring-metabase/localization.md)
- [Appearance](./configuring-metabase/appearance.md)
- [Caching query results](./configuring-metabase/caching.md)
- [Custom maps](./configuring-metabase/custom-maps.md)
- [Customizing the Metabase Jetty webserver](./configuring-metabase/customizing-jetty-webserver.md)

### Tools

- [Tools overview](./usage-and-performance-tools/start.md)
- [Usage analytics](./usage-and-performance-tools/usage-analytics.md)
- [Admin tools](./usage-and-performance-tools/tools.md)

### Metabase Cloud

- [Documentation for Metabase Cloud and Store](./cloud/start.md)

### Metabase API

- [Metabase API documentation](./api.html)
- [API tutorial](https://www.metabase.com/learn/metabase-basics/administration/administration-and-operation/metabase-api)

### Troubleshooting

- [Troubleshooting guides](./troubleshooting-guide/index.md)

### Developer guide

- [Developer guide](./developers-guide/start.md)

## Getting help

### Troubleshooting

- [Troubleshooting guides](troubleshooting-guide/index.md)
- [Metabase forum](https://discourse.metabase.com/)
- [Configuring logging](./configuring-metabase/log-configuration.md)

### Tutorials and guides

[Learn Metabase](https://www.metabase.com/learn) has a ton of articles on how to use Metabase, data best practices, and more.

## More resources

### [Discussion](https://discourse.metabase.com)

Share and connect with other Metabasers.

### [Community stories](https://www.metabase.com/community)

Practical advice from our community.

### [Metabase blog](https://www.metabase.com/blog)

News, updates, and ideas.

### [Customers](https://www.metabase.com/case-studies)

Real companies, real data, real stories.

### [Metabase Twitter](https://twitter.com/metabase)

We tweet stuff.

### [Source code repository on GitHub](https://github.com/metabase/metabase)

Follow us on GitHub.

### [List of releases](https://github.com/metabase/metabase/releases)

A list of all Metabase releases, including both the Enterprise Edition and the Open Source Edition.

### [Developers guide](./developers-guide/start.md)

Contribute to the Metabase open source project!

### [Data and Business Intelligence Glossary](https://www.metabase.com/glossary)

Data jargon explained.

### [Metabase Experts](https://www.metabase.com/partners/)

If you’d like more technical resources to set up your data stack with Metabase, connect with a [Metabase Expert](https://www.metabase.com/partners/).

<!-- bump 2 -->
