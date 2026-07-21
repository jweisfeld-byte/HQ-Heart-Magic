import { shopifyAdminGraphQL } from "@/lib/shopify/client";

export type RevenueYesterday = {
  orderCount: number;
  totalRevenue: number;
  currency: string;
};

export type LowInventoryVariant = {
  productTitle: string;
  variantTitle: string;
  quantity: number;
};

export type RecentOrder = {
  name: string;
  createdAt: string;
  customerName: string | null;
  total: number;
  currency: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
};

function yesterdayRangeUTC() {
  const now = new Date();
  const startOfToday = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const start = new Date(startOfToday - 24 * 60 * 60 * 1000);
  const end = new Date(startOfToday);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getYesterdayRevenue(): Promise<RevenueYesterday | null> {
  const { start, end } = yesterdayRangeUTC();

  const query = `
    query YesterdayOrders($queryString: String!) {
      orders(first: 250, query: $queryString) {
        nodes {
          currentTotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const data = await shopifyAdminGraphQL<{
    orders: {
      nodes: {
        currentTotalPriceSet: {
          shopMoney: { amount: string; currencyCode: string };
        };
      }[];
    };
  }>(query, {
    queryString: `created_at:>='${start}' AND created_at:<'${end}'`,
  });

  if (!data) return null;

  const nodes = data.orders.nodes;
  const totalRevenue = nodes.reduce(
    (sum, o) => sum + parseFloat(o.currentTotalPriceSet.shopMoney.amount),
    0,
  );
  const currency = nodes[0]?.currentTotalPriceSet.shopMoney.currencyCode ?? "USD";

  return { orderCount: nodes.length, totalRevenue, currency };
}

export async function getLowInventoryVariants(
  threshold = 5,
  limit = 10,
): Promise<LowInventoryVariant[] | null> {
  const query = `
    query LowInventory($queryString: String!, $limit: Int!) {
      productVariants(first: $limit, query: $queryString, sortKey: INVENTORY_TOTAL) {
        nodes {
          title
          inventoryQuantity
          product {
            title
          }
        }
      }
    }
  `;

  const data = await shopifyAdminGraphQL<{
    productVariants: {
      nodes: {
        title: string;
        inventoryQuantity: number;
        product: { title: string };
      }[];
    };
  }>(query, {
    queryString: `inventory_quantity:<=${threshold}`,
    limit,
  });

  if (!data) return null;

  return data.productVariants.nodes.map((v) => ({
    productTitle: v.product.title,
    variantTitle: v.title,
    quantity: v.inventoryQuantity,
  }));
}

export async function getRecentOrders(limit = 10): Promise<RecentOrder[] | null> {
  const query = `
    query RecentOrders($limit: Int!) {
      orders(first: $limit, sortKey: CREATED_AT, reverse: true) {
        nodes {
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          customer {
            displayName
          }
          currentTotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const data = await shopifyAdminGraphQL<{
    orders: {
      nodes: {
        name: string;
        createdAt: string;
        displayFinancialStatus: string | null;
        displayFulfillmentStatus: string | null;
        customer: { displayName: string } | null;
        currentTotalPriceSet: {
          shopMoney: { amount: string; currencyCode: string };
        };
      }[];
    };
  }>(query, { limit });

  if (!data) return null;

  return data.orders.nodes.map((o) => ({
    name: o.name,
    createdAt: o.createdAt,
    customerName: o.customer?.displayName ?? null,
    total: parseFloat(o.currentTotalPriceSet.shopMoney.amount),
    currency: o.currentTotalPriceSet.shopMoney.currencyCode,
    financialStatus: o.displayFinancialStatus,
    fulfillmentStatus: o.displayFulfillmentStatus,
  }));
}

export type ConversionRateLastWeek = {
  sessions: number;
  completedCheckouts: number;
  conversionRate: number; // fraction, e.g. 0.0041 == 0.41%
};

/**
 * Uses Shopify's ShopifyQL Analytics API (shopifyqlQuery), a separate data
 * surface from Orders/Products GraphQL — requires the read_reports scope.
 * If the stored access token predates that scope, this returns null just
 * like every other query here, so the dashboard tile falls back to "Not
 * connected yet" instead of breaking. See /api/shopify/install for scopes.
 */
export async function getConversionRateLastWeek(): Promise<ConversionRateLastWeek | null> {
  const query = `
    query ConversionRateLastWeek {
      shopifyqlQuery(query: "FROM sessions SHOW sessions, sessions_that_completed_checkout, conversion_rate SINCE -7d UNTIL today") {
        parseErrors
        tableData {
          rows
        }
      }
    }
  `;

  const data = await shopifyAdminGraphQL<{
    shopifyqlQuery: {
      parseErrors: string[];
      tableData: {
        rows: {
          sessions: string;
          sessions_that_completed_checkout: string;
          conversion_rate: string;
        }[];
      } | null;
    };
  }>(query);

  const row = data?.shopifyqlQuery?.tableData?.rows?.[0];
  if (!row) return null;

  return {
    sessions: Number(row.sessions),
    completedCheckouts: Number(row.sessions_that_completed_checkout),
    conversionRate: Number(row.conversion_rate),
  };
}

export type ChannelSales = {
  orderCount: number;
  totalRevenue: number;
  currency: string;
};

export type TodaySalesByChannel = {
  shopify: ChannelSales; // every channel except TikTok (Online Store, POS, etc.)
  tiktok: ChannelSales;
};

function todayRangeUTC() {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  return { start: start.toISOString(), end: now.toISOString() };
}

/**
 * Splits today's orders by sales channel so the dashboard can show
 * "Shopify" (the main store) and "TikTok" as separate tiles, even though
 * both land in the same Orders list — Shopify tags each order with
 * channelInformation.displayName ("Online Store", "TikTok", etc.).
 */
export async function getTodaySalesByChannel(): Promise<TodaySalesByChannel | null> {
  const { start, end } = todayRangeUTC();

  const query = `
    query TodayOrdersByChannel($queryString: String!) {
      orders(first: 250, query: $queryString) {
        nodes {
          channelInformation {
            displayName
          }
          currentTotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const data = await shopifyAdminGraphQL<{
    orders: {
      nodes: {
        channelInformation: { displayName: string | null } | null;
        currentTotalPriceSet: {
          shopMoney: { amount: string; currencyCode: string };
        };
      }[];
    };
  }>(query, {
    queryString: `created_at:>='${start}' AND created_at:<='${end}'`,
  });

  if (!data) return null;

  const nodes = data.orders.nodes;
  const isTikTok = (n: (typeof nodes)[number]) =>
    n.channelInformation?.displayName === "TikTok";

  function summarize(list: typeof nodes): ChannelSales {
    const totalRevenue = list.reduce(
      (sum, o) => sum + parseFloat(o.currentTotalPriceSet.shopMoney.amount),
      0,
    );
    const currency = list[0]?.currentTotalPriceSet.shopMoney.currencyCode ?? "USD";
    return { orderCount: list.length, totalRevenue, currency };
  }

  return {
    shopify: summarize(nodes.filter((n) => !isTikTok(n))),
    tiktok: summarize(nodes.filter(isTikTok)),
  };
}

export type MonthToDateSales = {
  orderCount: number;
  totalRevenue: number;
  currency: string;
};

function monthToDateRangeUTC() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { start: start.toISOString(), end: now.toISOString() };
}

/**
 * Total sales month-to-date across every channel. Paginates (unlike the
 * other tiles here) since a full month can plausibly exceed 250 orders,
 * capped at 10 pages (2,500 orders) as a sane upper bound.
 */
export async function getTotalSalesThisMonth(): Promise<MonthToDateSales | null> {
  const { start, end } = monthToDateRangeUTC();
  const queryString = `created_at:>='${start}' AND created_at:<='${end}'`;

  const query = `
    query MonthToDateOrders($queryString: String!, $after: String) {
      orders(first: 250, query: $queryString, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          currentTotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  let orderCount = 0;
  let totalRevenue = 0;
  let currency = "USD";
  let after: string | undefined;
  let pages = 0;
  let sawAnyPage = false;

  while (pages < 10) {
    const data = await shopifyAdminGraphQL<{
      orders: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: {
          currentTotalPriceSet: {
            shopMoney: { amount: string; currencyCode: string };
          };
        }[];
      };
    }>(query, { queryString, after });

    if (!data) return sawAnyPage ? { orderCount, totalRevenue, currency } : null;
    sawAnyPage = true;

    for (const o of data.orders.nodes) {
      totalRevenue += parseFloat(o.currentTotalPriceSet.shopMoney.amount);
      currency = o.currentTotalPriceSet.shopMoney.currencyCode;
    }
    orderCount += data.orders.nodes.length;
    pages += 1;

    if (!data.orders.pageInfo.hasNextPage) break;
    after = data.orders.pageInfo.endCursor ?? undefined;
  }

  return { orderCount, totalRevenue, currency };
}
