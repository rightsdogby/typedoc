import type { Application } from "../application";
import type { ProjectReflection, Reflection } from "../models";
import type { ToDiscriminatedUnion } from "../utils/general";
import type { EventHooks } from "../utils/hooks";
import type { ThemeRouter } from "./router";

/**
 * Helpers which will be passed with the {@link TemplateContext} into any
 * rendering function. This is an interface so that themes which add their
 * own helpers can use declaration merging to add elements to the interface.
 */
export interface ThemeHelpers {
    renderMarkdown(markdown: string): Element;
}

/**
 * A map of all types of pages that the renderer can render to. If you use
 * declaration merging to add a new page type, you must also call
 * {@link Renderer.setPageTemplate} with an appropriate default renderer to
 * use if a user's theme does not provide one.
 */
export interface PageTypes {
    markdown: {
        parent: Reflection;
        content: string;
    };
    reflection: Reflection;
}

/**
 * Context object expected by rendering functions.
 */
export interface TemplateContext {
    application: Application;
    project: ProjectReflection;
    model: ToDiscriminatedUnion<PageTypes>;
    router: ThemeRouter;
    helpers: ThemeHelpers;
    hooks: EventHooks<HtmlRendererHooks, Element | null>;
}

export interface HtmlRendererHooks {
    /**
     * Emitted after the page has been rendered via templates. May be used to rewrite parts of the page.
     */
    page: [Element | null];

    /**
     * Emitted at the start of the `<head>` element.
     */
    "head.begin": [TemplateContext];

    /**
     * Emitted at the end of the `<head>` element.
     */
    "head.end": [TemplateContext];

    /**
     * Emitted at the start of the `<body>` element.
     */
    "body.begin": [TemplateContext];

    /**
     * Emitted at the end of the `<body>` element.
     */
    "body.end": [TemplateContext];
}
