export interface DeploymentTemplate {
	Env: string;
	Components: Array<Component>;
}

export interface Component {
	Name: string;
	Provider: Provider;
	Inputs?: Array<{Key: string; Value: string}>;
	Outputs?: Array<{Key: string; Value: string}>;
}

interface Provider {
	Name: string;
	Config?: Array<{Key: string; Value: string}>;
}