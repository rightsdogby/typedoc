import { ok } from "assert";
import { join, resolve } from "path";
import type { Application } from "../application";
import type { ProjectReflection, Reflection } from "../models";
import type { Renderer } from "../renderer";
import { remove, writeFile } from "../utils/fs";
import type { StringIfExternal, Writable } from "../utils/general";
import { EventHooks } from "../utils/hooks";
import type { Element } from "../utils/jsx";
import type { TypeDocThemes } from "../utils/options/declaration";
import { renderElement } from "../utils/template";
import { ThemeRouter, ThemeRouterConstructor } from "./router";
import { TemplateContext, templates } from "./templates";

export interface ThemeContext {}

export interface ThemeDefinition {
    /**
     * The router used to determine page locations and how to construct links
     * between pages. If not specified, defaults to {@link ThemeRouter}
     */
    readonly router: ThemeRouterConstructor;

    /**
     * The templates used by the theme. If not set, will use the default templates.
     */
    readonly templates: object;

    /**
     * Actions performed before rendering the project with this theme.
     */
    readonly preRender: Record<
        string,
        (context: ThemeContext) => Promise<void> | void
    >;

    /**
     * Actions performed after rendering the project with this theme.
     */
    readonly postRender: Record<
        string,
        (context: ThemeContext) => Promise<void> | void
    >;
}

export type BuiltinThemeActions = string;

export interface ThemeConfiguration {
    /**
     * The router used to determine page locations and how to construct links
     * between pages. If not specified, defaults to {@link ThemeRouter}
     */
    readonly router?: ThemeRouterConstructor;

    /**
     * The templates used by the theme. If not set, will use the default templates.
     */
    readonly templates?: Partial<object>;

    /**
     * Actions performed before rendering the project with this theme.
     */
    readonly preRender?: Record<
        string,
        (context: ThemeContext) => Promise<void> | void
    >;

    /**
     * Actions performed after rendering the project with this theme.
     */
    readonly postRender?: Record<
        string,
        (context: ThemeContext) => Promise<void> | void
    >;

    /**
     * An optional theme to inherit settings from.
     */
    readonly parent?: StringIfExternal<TypeDocThemes>;

    /**
     * Any pre-render or post-render actions which need to be disabled by this theme.
     */
    readonly suppress?: readonly StringIfExternal<BuiltinThemeActions>[];
}

interface HtmlRendererHooks {
    page: [Element | null];
}

export class HtmlRenderer implements Renderer {
    readonly name = "html";
    readonly hooks = new EventHooks<HtmlRendererHooks, Element | null>();

    private readonly _themes = new Map<string, ThemeDefinition>();

    constructor(private app: Application) {
        this._themes.set("default", {
            postRender: {},
            preRender: {},
            router: ThemeRouter,
            templates: templates,
        });
    }

    isEnabled(): boolean {
        return this.app.options.isSet("out");
    }

    async render(project: ProjectReflection) {
        const out = resolve(this.app.options.getValue("out") || "./docs");
        const theme = this.getTheme(this.app.options.getValue("theme"));

        if (!this.app.options.getValue("disableOutputCheck")) {
            await remove(out);
        }

        const tasks: Promise<void>[] = [];
        const queue: Reflection[] = [];
        let current: Reflection | undefined = project;

        const router = new theme.router(project);

        do {
            const path = router.getDocumentName(current);
            queue.push(...router.getChildrenNotInPage(current));

            this.app.logger.verbose(`${current.getFullName()} ===> ${path}`);
            const context: TemplateContext = {
                application: this.app,
                router,
                hooks: this.hooks,
                project,
                reflection: current,
                renderMarkdown: (text) => ({
                    children: [text],
                    tag: "div",
                    props: null,
                }),
            };
            const content = templates.Page(context);

            const renderedPage = this.hooks.reduce("page", content);

            if (renderedPage) {
                tasks.push(
                    writeFile(
                        join(out, path),
                        "<!DOCTYPE html>" + renderElement(renderedPage)
                    )
                );
            }
        } while ((current = queue.shift()));

        await Promise.all(tasks);
    }

    addTheme(name: StringIfExternal<TypeDocThemes>, theme: ThemeConfiguration) {
        ok(
            !this._themes.has(name),
            `The theme "${name}" has already been defined.`
        );

        const definition = cloneDefinition(
            this.getTheme(theme.parent ?? "default")
        );

        if (theme.router) {
            definition.router = theme.router;
        }

        if (theme.templates) {
            Object.assign(definition.templates, theme.templates);
        }

        if (theme.preRender) {
            Object.assign(definition.preRender, theme.preRender);
        }

        if (theme.postRender) {
            Object.assign(definition.postRender, theme.postRender);
        }

        for (const item in theme.suppress ?? []) {
            delete definition.preRender[item];
            delete definition.postRender[item];
        }

        this._themes.set(name, definition);
    }

    /**
     * Gets a defined theme, throws if it does not exist.
     */
    private getTheme(name: StringIfExternal<TypeDocThemes>): ThemeDefinition {
        const theme = this._themes.get(name);
        if (!theme) {
            throw new Error(`The theme "${name}" has not been defined`);
        }
        return theme;
    }
}

// No need to pull in a new package for deep cloning... we only need one level.
function cloneDefinition(def: ThemeDefinition): Writable<ThemeDefinition> {
    return {
        router: def.router,
        templates: { ...def.templates },
        preRender: { ...def.preRender },
        postRender: { ...def.postRender },
    };
}
