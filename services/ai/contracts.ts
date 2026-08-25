export interface CeramicConceptRequest { prompt: string; locale: "fa" | "en"; }
export interface CeramicConceptResult { imageUrl: string; revisedPrompt?: string; }
export interface CeramicConceptGateway { generate(input: CeramicConceptRequest): Promise<CeramicConceptResult>; }
