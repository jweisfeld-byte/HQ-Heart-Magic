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
