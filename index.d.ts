export type Data = Record<string, any>;
export type DontEnvArgs = {
	extension?: string;
	path?: string;
	expand?: boolean;
	priorities?: {[key: string]: number};
};
export class DotEnv {
	public path: string | null | undefined;
	public ext: string | null | undefined;
	public expand: string | null | undefined;
	public env: Data | null | undefined;
	public envString: string | null | undefined;
	constructor(args?: DontEnvArgs);
	public load(loadOnProcess: boolean): DotEnv;
	public get(): Data;
	public find(): string | null;
	public save(changes: Data): DotEnv;
	public setPriorities(priorities?: {[key: string]: number}): DotEnv;
	private escapeRegExp(value: string): string;
}
export function dotenvLoad(ext?: string, path?: string): DotEnv;
