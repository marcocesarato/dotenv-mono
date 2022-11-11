export type Data = Record<string, any>;
export type DontEnvArgs = {
	extension?: string;
	path?: string;
	expand?: boolean;
	priorities?: {[key: string]: number};
	depth?: number;
	cwd?: string;
};

export class DotEnv {
	public path: string | null | undefined;
	public cwd: string | null | undefined;
	public priorities?: {[key: string]: number} | null | undefined;
	public extension: string | null | undefined;
	public depth: number | null | undefined;
	public expand: boolean | null | undefined;
	public env: Data | null | undefined;
	public plain: string | null | undefined;
	public encoding: string | null | undefined;
	public debug: boolean | null | undefined;
	public override: boolean | null | undefined;
	private _cwd: string | null | undefined;
	private _priorities?: {[key: string]: number} | null | undefined;
	private _depth: number | null | undefined;
	private _expand: boolean | null | undefined;
	private _encoding: string | null | undefined;
	private _debug: boolean | null | undefined;
	private _override: boolean | null | undefined;

	constructor(args?: DontEnvArgs);

	public load(loadOnProcess: boolean): DotEnv;

	public get(): Data;

	public find(): string | null;

	public save(changes: Data): DotEnv;

	public parse<T extends Data = Data>(src: string | Buffer): T;

	private escapeRegExp(value: string): string;
}

export function dotenvLoad(ext?: string, path?: string): DotEnv;
