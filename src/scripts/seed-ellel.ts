import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
    Modules,
    ProductStatus,
} from "@medusajs/framework/utils";
import {
    createProductCategoriesWorkflow,
    createProductsWorkflow,
    createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function seedEllelData({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
    const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

    logger.info("Starting Ellel Oversize custom seeding...");

    // Get existing default sales channel
    const [defaultSalesChannel] = await salesChannelModuleService.listSalesChannels({
        name: "Default Sales Channel",
    });

    // Get existing shipping profile
    const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
        type: "default",
    });
    const shippingProfile = shippingProfiles[0];

    // Get existing stock location
    const { data: stockLocations } = await query.graph({
        entity: "stock_location",
        fields: ["id"],
    });
    const stockLocation = stockLocations[0];

    logger.info("Creating Ellel product categories...");
    const { result: categoryResult } = await createProductCategoriesWorkflow(
        container
    ).run({
        input: {
            product_categories: [
                { name: "Buzos", is_active: true },
                { name: "Conjuntos", is_active: true },
                { name: "Pantalones", is_active: true },
                { name: "Camisetas", is_active: true },
            ],
        },
    });

    logger.info("Creating Ellel products...");
    const { result: productResult } = await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Sudadera Negra con gorro verde",
                    handle: "sudadera-negra-gorro-verde",
                    description: "Sudadera oversize minimalista con detalle de gorro verde. SKU: AG-001",
                    status: ProductStatus.PUBLISHED,
                    shipping_profile_id: shippingProfile.id,
                    category_ids: [categoryResult.find((cat) => cat.name === "Buzos")!.id],
                    sales_channels: [{ id: defaultSalesChannel.id }],
                    options: [
                        { title: "Talla", values: ["S", "M", "L", "XL", "XXL"] },
                        { title: "Color", values: ["Negro"] },
                    ],
                    variants: ["S", "M", "L", "XL", "XXL"].map((size) => ({
                        title: `${size} / Negro`,
                        sku: `AG-001-${size}`,
                        options: { Talla: size, Color: "Negro" },
                        prices: [{ amount: 25, currency_code: "usd" }],
                    })),
                },
                {
                    title: "Chaqueta Bomber Negra",
                    handle: "chaqueta-bomber-negra",
                    description: "Chaqueta tipo bomber clásica en color negro intenso. SKU: AG-002",
                    status: ProductStatus.PUBLISHED,
                    shipping_profile_id: shippingProfile.id,
                    category_ids: [categoryResult.find((cat) => cat.name === "Camisetas")!.id], // User said Camisetas for this in my plan, though it's a jacket.
                    sales_channels: [{ id: defaultSalesChannel.id }],
                    options: [
                        { title: "Talla", values: ["S", "M", "L", "XL", "XXL"] },
                        { title: "Color", values: ["Negro"] },
                    ],
                    variants: ["S", "M", "L", "XL", "XXL"].map((size) => ({
                        title: `${size} / Negro`,
                        sku: `AG-002-${size}`,
                        options: { Talla: size, Color: "Negro" },
                        prices: [{ amount: 30, currency_code: "usd" }],
                    })),
                },
                {
                    title: "Sudadera Verde Oliva",
                    handle: "sudadera-verde-oliva",
                    description: "Sudadera oversize en color verde oliva terroso. SKU: AG-003",
                    status: ProductStatus.PUBLISHED,
                    shipping_profile_id: shippingProfile.id,
                    category_ids: [categoryResult.find((cat) => cat.name === "Buzos")!.id],
                    sales_channels: [{ id: defaultSalesChannel.id }],
                    options: [
                        { title: "Talla", values: ["S", "M", "L", "XL", "XXL"] },
                        { title: "Color", values: ["Verde Oliva"] },
                    ],
                    variants: ["S", "M", "L", "XL", "XXL"].map((size) => ({
                        title: `${size} / Verde Oliva`,
                        sku: `AG-003-${size}`,
                        options: { Talla: size, Color: "Verde Oliva" },
                        prices: [{ amount: 25, currency_code: "usd" }],
                    })),
                },
                {
                    title: "Conjunto Beige y Azul",
                    handle: "conjunto-beige-azul",
                    description: "Conjunto de dos piezas premium en tonos beige y azul. SKU: AG-004",
                    status: ProductStatus.PUBLISHED,
                    shipping_profile_id: shippingProfile.id,
                    category_ids: [categoryResult.find((cat) => cat.name === "Conjuntos")!.id],
                    sales_channels: [{ id: defaultSalesChannel.id }],
                    options: [
                        { title: "Talla", values: ["S", "M", "L", "XL", "XXL"] },
                        { title: "Color", values: ["Beige/Azul"] },
                    ],
                    variants: ["S", "M", "L", "XL", "XXL"].map((size) => ({
                        title: `${size} / Beige-Azul`,
                        sku: `AG-004-${size}`,
                        options: { Talla: size, Color: "Beige/Azul" },
                        prices: [{ amount: 45, currency_code: "usd" }],
                    })),
                },
            ],
        },
    });

    logger.info("Seeding inventory for new products...");
    const { data: inventoryItems } = await query.graph({
        entity: "inventory_item",
        fields: ["id", "sku"],
        filters: {
            sku: { $like: "AG-%" },
        },
    });

    const inventoryLevels: CreateInventoryLevelInput[] = inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 100,
        inventory_item_id: item.id,
    }));

    await createInventoryLevelsWorkflow(container).run({
        input: { inventory_levels: inventoryLevels },
    });

    logger.info("Finished Ellel Oversize custom seeding successfully!");
}
