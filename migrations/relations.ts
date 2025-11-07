import { relations } from "drizzle-orm/relations";
import { productionPortalListings, listingEmbeddings, canonicalListings, llmReports, listingSources, ingestionLogs, aetherOrganizations, aetherProperties, aetherArticles, aetherArticleImpacts, aetherUsers, aetherGoogleTokens, aetherMetaTokens } from "./schema";

export const listingEmbeddingsRelations = relations(listingEmbeddings, ({one}) => ({
	productionPortalListing: one(productionPortalListings, {
		fields: [listingEmbeddings.listingId],
		references: [productionPortalListings.id]
	}),
}));

export const productionPortalListingsRelations = relations(productionPortalListings, ({many}) => ({
	listingEmbeddings: many(listingEmbeddings),
}));

export const llmReportsRelations = relations(llmReports, ({one}) => ({
	canonicalListing: one(canonicalListings, {
		fields: [llmReports.listingId],
		references: [canonicalListings.id]
	}),
}));

export const canonicalListingsRelations = relations(canonicalListings, ({one, many}) => ({
	llmReports: many(llmReports),
	listingSource: one(listingSources, {
		fields: [canonicalListings.sourceId],
		references: [listingSources.id]
	}),
}));

export const listingSourcesRelations = relations(listingSources, ({many}) => ({
	canonicalListings: many(canonicalListings),
	ingestionLogs: many(ingestionLogs),
}));

export const ingestionLogsRelations = relations(ingestionLogs, ({one}) => ({
	listingSource: one(listingSources, {
		fields: [ingestionLogs.sourceId],
		references: [listingSources.id]
	}),
}));

export const aetherPropertiesRelations = relations(aetherProperties, ({one}) => ({
	aetherOrganization: one(aetherOrganizations, {
		fields: [aetherProperties.orgId],
		references: [aetherOrganizations.id]
	}),
}));

export const aetherOrganizationsRelations = relations(aetherOrganizations, ({many}) => ({
	aetherProperties: many(aetherProperties),
	aetherUsers: many(aetherUsers),
	aetherGoogleTokens: many(aetherGoogleTokens),
	aetherMetaTokens: many(aetherMetaTokens),
}));

export const aetherArticleImpactsRelations = relations(aetherArticleImpacts, ({one}) => ({
	aetherArticle: one(aetherArticles, {
		fields: [aetherArticleImpacts.articleId],
		references: [aetherArticles.id]
	}),
}));

export const aetherArticlesRelations = relations(aetherArticles, ({many}) => ({
	aetherArticleImpacts: many(aetherArticleImpacts),
}));

export const aetherUsersRelations = relations(aetherUsers, ({one}) => ({
	aetherOrganization: one(aetherOrganizations, {
		fields: [aetherUsers.orgId],
		references: [aetherOrganizations.id]
	}),
}));

export const aetherGoogleTokensRelations = relations(aetherGoogleTokens, ({one}) => ({
	aetherOrganization: one(aetherOrganizations, {
		fields: [aetherGoogleTokens.orgId],
		references: [aetherOrganizations.id]
	}),
}));

export const aetherMetaTokensRelations = relations(aetherMetaTokens, ({one}) => ({
	aetherOrganization: one(aetherOrganizations, {
		fields: [aetherMetaTokens.orgId],
		references: [aetherOrganizations.id]
	}),
}));