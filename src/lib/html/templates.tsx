import { ok } from "assert";
import type { Application } from "../application";
import {
    ArrayType,
    DeclarationHierarchy,
    DeclarationReflection,
    ProjectReflection,
    ReferenceType,
    Reflection,
    ReflectionKind,
    SignatureReflection,
    Type,
} from "../models";
import type { EventHooks } from "../utils/hooks";
import { Children, Element, Fragment, Raw } from "../utils/jsx";
import { createElement } from "../utils/template";
import type { ThemeRouter } from "./router";

const analytics = `(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'ID', 'SITE');
ga('send', 'pageview');`;

export const templates = {
    Page(context: TemplateContext) {
        const { reflection, project, router, hooks } = context;

        return (
            <>
                <html>
                    <head>
                        {hooks.emit("head.begin", context)}
                        <title>
                            {reflection.kindOf(ReflectionKind.Project)
                                ? reflection.name
                                : `${project.name} | ${reflection.name}`}
                        </title>
                        <meta name="description" content={`Documentation for ${project.name}`} />
                        <meta name="viewport" content="width=device-width, initial-scale=1" />
                        <link rel="stylesheet" href={router.createAssetLink(reflection, "main.css")} />
                        <script async src={router.createAssetLink(reflection, "search.js")} />
                        <script defer src={router.createAssetLink(reflection, "main.js")} />
                        {hooks.emit("head.end", context)}
                    </head>
                </html>
                <body>
                    {hooks.emit("body.begin", context)}
                    <templates.Header {...context} />
                    <div class="container container-main">
                        <div class="row">
                            <div class="col-8 col-content">
                                <templates.Reflection {...context} />
                            </div>
                            <div class="col-4 col-menu menu-sticky-wrap menu-highlight">TODO NAVIGATION</div>
                        </div>
                    </div>
                    <templates.Footer {...context} />
                    <div class="overlay"></div>
                    {hooks.emit("body.end", context)}
                </body>
            </>
        );
    },

    Header(context: TemplateContext) {
        const { application, router, project, reflection } = context;

        return (
            <header>
                <div class="tsd-page-toolbar">
                    <div class="container">
                        <div class="table-wrap">
                            <div class="table-cell" id="tsd-search" data-base={router.createLink(project, reflection)}>
                                <div class="field">
                                    <label for="tsd-search-field" class="tsd-widget search no-caption">
                                        Search
                                    </label>
                                    <input id="tsd-search-field" type="text" />
                                </div>

                                <ul class="results">
                                    <li class="state loading">Preparing search index...</li>
                                    <li class="state failure">The search index is not available</li>
                                </ul>

                                <a href={router.createLink(reflection, project)} class="title">
                                    {project.name}
                                </a>
                            </div>
                            <div class="table-cell" id="tsd-widgets">
                                <div id="tsd-filter">
                                    <a href="#" class="tsd-widget options no-caption" data-toggle="options">
                                        Options
                                    </a>
                                    <div class="tsd-filter-group">
                                        <div class="tsd-select" id="tsd-filter-visibility">
                                            <span class="tsd-select-label">All</span>
                                            <ul class="tsd-select-list">
                                                <li data-value="public">Public</li>
                                                <li data-value="protected">Public/Protected</li>
                                                <li data-value="private" class="selected">
                                                    All
                                                </li>
                                            </ul>
                                        </div>

                                        <input type="checkbox" id="tsd-filter-inherited" checked />
                                        <label class="tsd-widget" for="tsd-filter-inherited">
                                            Inherited
                                        </label>

                                        {!application.options.getValue("excludeExternals") && (
                                            <>
                                                <input type="checkbox" id="tsd-filter-externals" checked />
                                                <label class="tsd-widget" for="tsd-filter-externals">
                                                    Externals
                                                </label>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <a href="#" class="tsd-widget menu no-caption" data-toggle="menu">
                                    Menu
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tsd-page-title">
                    <div class="container">
                        <templates.Breadcrumbs {...context} />
                        <h1>
                            {reflection != project && reflection.kindString} {reflection.name}
                            {renderTypeParameters(reflection)}
                        </h1>
                    </div>
                </div>
            </header>
        );
    },

    Footer(context: TemplateContext) {
        const { application } = context;
        return (
            <>
                TODO LEGEND
                {!application.options.getValue("hideGenerator") && (
                    <div class="container tsd-generator">
                        <p>
                            Generated using{" "}
                            <a href="https://typedoc.org" target="_blank">
                                TypeDoc
                            </a>
                        </p>
                    </div>
                )}
            </>
        );
    },

    Reflection(context: TemplateContext) {
        return <span>{context.reflection.name}</span>;
    },

    Analytics(context: TemplateContext) {
        const { application } = context;
        const gaId = application.options.getValue("gaID");
        const gaSite = application.options.getValue("gaSite");

        return (
            <>
                {gaId && (
                    <script>
                        <Raw html={analytics.replace("SITE", gaSite).replace("ID", gaId)} />
                    </script>
                )}
            </>
        );
    },

    Breadcrumbs(context: TemplateContext) {
        const { reflection, project, router } = context;

        if (reflection === project) {
            return <></>;
        }

        let current: Reflection | undefined = reflection;
        const elements: Element[] = [];
        while (current) {
            elements.unshift(
                <li>
                    <a href={router.createLink(reflection, current)}>{current.name}</a>
                </li>
            );
            current = current.parent;
        }

        return <ul class="tsd-breadcrumb">{elements}</ul>;
    },

    Comment(context: TemplateContext) {
        const { renderMarkdown } = context;
        const comment = context.reflection.comment;

        if (!comment || !comment.hasVisibleComponent()) {
            return <></>;
        }

        return (
            <div class="tsd-comment tsd-typography">
                {comment.shortText && <div class="lead">{renderMarkdown(comment.shortText)}</div>}
                {comment.text && <div class="lead">{renderMarkdown(comment.text)}</div>}
                {comment.tags.length && (
                    <dl class="tsd-comment-tags">
                        {comment.tags.map((tag) => (
                            <>
                                <dt>{tag.tagName}</dt>
                                <dd>{renderMarkdown(comment.text)}</dd>
                            </>
                        ))}
                    </dl>
                )}
            </div>
        );
    },

    Hierarchy(context: TemplateContext) {
        const reflection = context.reflection;
        if (!(reflection instanceof DeclarationReflection) || !reflection.typeHierarchy) {
            return <></>;
        }

        function renderHierarchy(hierarchy: DeclarationHierarchy) {
            return hierarchy.types.map((type, i) => {
                const last = i === hierarchy.types.length - 1;
                // FIXME RENDER TYPE
                return (
                    <li>
                        {hierarchy.isTarget ? <span class="target">{renderType(type)}</span> : renderType(type)}
                        {last && hierarchy.next && renderHierarchy(hierarchy.next)}
                    </li>
                );
            });
        }

        return (
            <section class="tsd-panel tsd-hierarchy">
                <h3>Hierarchy</h3>
                {renderHierarchy(reflection.typeHierarchy)}
            </section>
        );
    },

    Index(context: TemplateContext) {
        const { reflection, router } = context;
        ok(reflection instanceof DeclarationReflection);

        if (reflection.categories) {
            return (
                <section class="tsd-panel-group tsd-index-group">
                    <h2>Index</h2>
                    <section class="tsd-panel tsd-index-panel">
                        <div class="tsd-index-content">
                            {reflection.categories.map((cat) => (
                                <section class="tsd-index-section">
                                    <h3>{cat.title}</h3>
                                    {renderIndexList(cat.children)}
                                </section>
                            ))}
                        </div>
                    </section>
                </section>
            );
        }

        if (reflection.groups) {
            return (
                <section class="tsd-panel-group tsd-index-group">
                    <h2>Index</h2>
                    <section class="tsd-panel tsd-index-panel">
                        <div class="tsd-index-content">
                            {reflection.groups.map((group) => {
                                let content: Element | Element[];
                                if (group.categories) {
                                    content = group.categories.map((cat) => {
                                        return (
                                            <>
                                                <h3>
                                                    {cat.title} {group.title}
                                                </h3>
                                                {renderIndexList(cat.children)}
                                            </>
                                        );
                                    });
                                } else {
                                    content = (
                                        <>
                                            <h3>{group.title}</h3>
                                            {renderIndexList(group.children)}
                                        </>
                                    );
                                }
                                return (
                                    <section class={"tsd-index-section " + (reflection.cssClasses ?? "")}>
                                        {content}
                                    </section>
                                );
                            })}
                        </div>
                    </section>
                </section>
            );
        }

        return <></>;

        function renderIndexList(children: Reflection[]) {
            return (
                <ul class="tsd-index-list">
                    {children.map((child) => {
                        return (
                            <li class={child.cssClasses}>
                                <a href={router.createLink(reflection, child)}>{child.name}</a>
                            </li>
                        );
                    })}
                </ul>
            );
        }
    },

    DeclarationMember(context: TemplateContext) {
        const { reflection } = context;
        ok(reflection instanceof DeclarationReflection);

        return (
            <>
                <div class="tsd-signature tsd-kind-icon">
                    {reflection.name}
                    {renderTypeParameters(reflection)}
                    <span class="tsd-signature-symbol">{reflection.flags.isOptional && "?"}:</span>{" "}
                    {renderType(reflection.type)}
                </div>
                <templates.Sources {...context} />
                <templates.Comment {...context} />
            </>
        );
    },

    Sources(context: TemplateContext) {
        const { reflection: r, router } = context;
        ok(r instanceof DeclarationReflection);

        return (
            <aside class="tsd-sources">
                {r.implementationOf && <p>Implementation of {typeAndParent(r.implementationOf, r, router)}</p>}
                {r.inheritedFrom && <p>Inherited from {typeAndParent(r.inheritedFrom, r, router)}</p>}
                {r.overwrites && <p>Inherited from {typeAndParent(r.overwrites, r, router)}</p>}
                {r.sources?.length && (
                    <ul>
                        {r.sources.map((source) => {
                            if (source.url) {
                                return (
                                    <li>
                                        Defined in{" "}
                                        <a href={source.url}>
                                            {source.fileName}:{source.line}
                                        </a>
                                    </li>
                                );
                            } else {
                                <li>
                                    Defined in {source.fileName}:{source.line}
                                </li>;
                            }
                        })}
                    </ul>
                )}
            </aside>
        );
    },
} as const;

function renderTypeParameters(reflection: Reflection) {
    if (reflection instanceof DeclarationReflection) {
        return reflection.typeParameters?.map((param, i, arr) => (
            <>
                {i == 0 && "<"}
                {i != 0 && ", "}
                {param.name}
                {i == arr.length - 1 && ">"}
            </>
        ));
    }
}

function renderType(type: Type | undefined) {
    return type?.toString() ?? "any";
}

function typeAndParent(type: Type, reflection: Reflection, router: ThemeRouter): Children {
    if (type instanceof ArrayType) {
        return <>{typeAndParent(type.elementType, reflection, router)}[]</>;
    }

    if (type instanceof ReferenceType && type.reflection) {
        if (type.reflection instanceof SignatureReflection) {
            return (
                <>
                    <a href={router.createLink(reflection, type.reflection.parent!.parent!)}>
                        {type.reflection.parent!.parent!.name}
                    </a>
                    <a href={router.createLink(reflection, type.reflection)}>{type.reflection.name}</a>
                </>
            );
        } else {
            return (
                <>
                    <a href={router.createLink(reflection, type.reflection.parent!)}>{type.reflection.parent!.name}</a>
                    <a href={router.createLink(reflection, type.reflection)}>{type.reflection.name}</a>
                </>
            );
        }
    }

    return type.toString();
}
