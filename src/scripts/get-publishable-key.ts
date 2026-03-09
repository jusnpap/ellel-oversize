import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function getPublishableKey({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data } = await query.graph({
        entity: "api_key",
        fields: ["id", "token", "title"],
        filters: {
            type: "publishable",
        },
    });

    if (data && data.length > 0) {
        logger.info("Publishable API Keys found:");
        data.forEach((key: any) => {
            logger.info(`Title: ${key.title}, Token: ${key.token}`);
        });
    } else {
        logger.info("No publishable API keys found.");
    }
}
