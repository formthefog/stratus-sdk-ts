/**
 * Stratus SDK - Weaviate Integration
 *
 * Drop-in wrapper for Weaviate with transparent compression.
 *
 * @purpose Weaviate vector database integration with transparent compression
 */
import { StratusAdapter } from './base.js';
import { StratusIntegrationConfig } from './types.js';
export interface WeaviateObject {
    id?: string;
    class: string;
    properties: Record<string, unknown>;
    vector?: number[] | Float32Array;
}
export interface WeaviateQueryParams {
    class: string;
    vector?: number[] | Float32Array;
    limit?: number;
    offset?: number;
    where?: unknown;
    certainty?: number;
}
export interface WeaviateResult {
    id: string;
    class: string;
    properties: Record<string, unknown>;
    vector?: number[] | Float32Array;
    certainty?: number;
}
export interface WeaviateClient {
    data: {
        creator(): {
            withClassName(className: string): WeaviateCreatorBuilder;
            withProperties(properties: Record<string, unknown>): WeaviateCreatorBuilder;
            withVector(vector: number[]): WeaviateCreatorBuilder;
            do(): Promise<WeaviateObject>;
        };
        getter(): {
            withClassName(className: string): WeaviateGetterBuilder;
            withId(id: string): WeaviateGetterBuilder;
            do(): Promise<WeaviateObject>;
        };
    };
    graphql: {
        get(): {
            withClassName(className: string): WeaviateGraphQLBuilder;
            withNearVector(params: unknown): WeaviateGraphQLBuilder;
            withLimit(limit: number): WeaviateGraphQLBuilder;
            withFields(fields: string): WeaviateGraphQLBuilder;
            do(): Promise<{
                data: {
                    Get: Record<string, WeaviateResult[]>;
                };
            }>;
        };
    };
    batch: {
        objectsBatcher(): {
            withObjects(objects: WeaviateObject[]): WeaviateBatchBuilder;
            do(): Promise<unknown>;
        };
    };
}
interface WeaviateCreatorBuilder {
    withClassName(className: string): WeaviateCreatorBuilder;
    withProperties(properties: Record<string, unknown>): WeaviateCreatorBuilder;
    withVector(vector: number[]): WeaviateCreatorBuilder;
    do(): Promise<WeaviateObject>;
}
interface WeaviateGetterBuilder {
    withClassName(className: string): WeaviateGetterBuilder;
    withId(id: string): WeaviateGetterBuilder;
    do(): Promise<WeaviateObject>;
}
interface WeaviateGraphQLBuilder {
    withClassName(className: string): WeaviateGraphQLBuilder;
    withNearVector(params: unknown): WeaviateGraphQLBuilder;
    withLimit(limit: number): WeaviateGraphQLBuilder;
    withFields(fields: string): WeaviateGraphQLBuilder;
    do(): Promise<{
        data: {
            Get: Record<string, WeaviateResult[]>;
        };
    }>;
}
interface WeaviateBatchBuilder {
    withObjects(objects: WeaviateObject[]): WeaviateBatchBuilder;
    do(): Promise<unknown>;
}
export declare class StratusWeaviate extends StratusAdapter {
    private client;
    constructor(client: WeaviateClient, config?: StratusIntegrationConfig);
    createObject(object: WeaviateObject): Promise<WeaviateObject>;
    createObjects(objects: WeaviateObject[]): Promise<void>;
    query(params: WeaviateQueryParams): Promise<WeaviateResult[]>;
    getObject(className: string, id: string): Promise<WeaviateObject>;
    private createBatches;
}
export {};
