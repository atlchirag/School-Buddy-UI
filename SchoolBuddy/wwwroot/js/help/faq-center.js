/*
 * School Buddy - Help & FAQs page.
 *
 * Data comes from FaqDataSource.load(). Today it returns the static data in
 * faq-data.js. To move FAQs to an API, set data-faq-source-url on #faqCenter
 * to an endpoint that returns { categories: [...], faqs: [...] } in the same
 * shape - nothing else in this file needs to change.
 */
(function (window, document) {
    "use strict";

    var root = document.getElementById("faqCenter");
    if (!root) {
        return;
    }

    /* =========================================================
       DATA SOURCE
    ========================================================= */

    var FaqDataSource = {
        load: function () {
            var url = root.getAttribute("data-faq-source-url");

            if (url) {
                return fetch(url, { headers: { "Accept": "application/json" }, credentials: "same-origin" })
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error("FAQ request failed: " + response.status);
                        }
                        return response.json();
                    });
            }

            return Promise.resolve(window.SchoolBuddyFaqData || { categories: [], faqs: [] });
        }
    };

    /* =========================================================
       ELEMENTS & STATE
    ========================================================= */

    var els = {
        search: document.getElementById("faqSearch"),
        clearSearch: document.getElementById("faqClearSearch"),
        categories: document.getElementById("faqCategories"),
        summary: document.getElementById("faqResultSummary"),
        results: document.getElementById("faqResults"),
        empty: document.getElementById("faqEmptyState"),
        emptyQuery: document.getElementById("faqEmptyQuery"),
        emptyReset: document.getElementById("faqEmptyReset")
    };

    var state = {
        categories: [],
        faqs: [],
        categoryById: {},
        activeCategory: "all",
        query: ""
    };

    /* =========================================================
       HELPERS
    ========================================================= */

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function normalize(value) {
        return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
    }

    function getTerms(query) {
        var normalized = normalize(query);
        return normalized ? normalized.split(" ") : [];
    }

    function stripFormatting(text) {
        return String(text || "").replace(/\*\*/g, "");
    }

    function byOrder(a, b) {
        return (a.order || 0) - (b.order || 0);
    }

    /* Escapes `text` and wraps every occurrence of a search term in <mark>. */
    function highlight(text, terms) {
        if (!terms.length) {
            return escapeHtml(text);
        }

        var lower = text.toLowerCase();
        var marks = new Array(text.length);

        terms.forEach(function (term) {
            var from = 0;
            var index;
            while (term && (index = lower.indexOf(term, from)) !== -1) {
                for (var i = index; i < index + term.length; i++) {
                    marks[i] = true;
                }
                from = index + term.length;
            }
        });

        var html = "";
        var open = false;
        for (var i = 0; i < text.length; i++) {
            if (marks[i] && !open) {
                html += "<mark>";
                open = true;
            } else if (!marks[i] && open) {
                html += "</mark>";
                open = false;
            }
            html += escapeHtml(text.charAt(i));
        }
        return open ? html + "</mark>" : html;
    }

    /* Renders a single line: **bold** segments + search highlighting. */
    function renderInline(text, terms) {
        return String(text).split("**").map(function (segment, index) {
            var content = highlight(segment, terms);
            return index % 2 === 1 ? "<strong>" + content + "</strong>" : content;
        }).join("");
    }

    /* Turns the plain-text answer format into paragraphs and lists. */
    function renderAnswer(answer, terms) {
        var html = "";
        var listType = null;

        function closeList() {
            if (listType) {
                html += "</" + listType + ">";
                listType = null;
            }
        }

        String(answer || "").split(/\r?\n/).forEach(function (rawLine) {
            var line = rawLine.trim();
            var ordered = /^\d+\.\s+/.exec(line);
            var bullet = /^-\s+/.exec(line);

            if (!line) {
                closeList();
                return;
            }

            if (ordered || bullet) {
                var type = ordered ? "ol" : "ul";
                if (listType !== type) {
                    closeList();
                    html += "<" + type + ">";
                    listType = type;
                }
                html += "<li>" + renderInline(line.slice((ordered || bullet)[0].length), terms) + "</li>";
                return;
            }

            closeList();
            html += "<p>" + renderInline(line, terms) + "</p>";
        });

        closeList();
        return html;
    }

    function buildSearchIndex(faq) {
        var category = state.categoryById[faq.category] || {};
        return normalize([
            faq.question,
            stripFormatting(faq.answer),
            category.name,
            category.shortName,
            (faq.keywords || []).join(" ")
        ].join(" "));
    }

    function matchesQuery(faq, terms) {
        return terms.every(function (term) {
            return faq._index.indexOf(term) !== -1;
        });
    }

    /* =========================================================
       URL STATE (shareable links: ?category=...&q=...#faq-id)
    ========================================================= */

    function readUrlState() {
        var params = new URLSearchParams(window.location.search);
        var category = params.get("category");

        if (category && state.categoryById[category]) {
            state.activeCategory = category;
        }
        state.query = params.get("q") || "";
        els.search.value = state.query;
    }

    function writeUrlState() {
        if (!window.history || !window.history.replaceState) {
            return;
        }

        var params = new URLSearchParams(window.location.search);
        params.delete("category");
        params.delete("q");
        if (state.activeCategory !== "all") {
            params.set("category", state.activeCategory);
        }
        if (normalize(state.query)) {
            params.set("q", state.query.trim());
        }

        var search = params.toString();
        window.history.replaceState(null, "", window.location.pathname + (search ? "?" + search : ""));
    }

    /* =========================================================
       RENDERING
    ========================================================= */

    function renderCategories(searchMatches) {
        var counts = { all: searchMatches.length };
        searchMatches.forEach(function (faq) {
            counts[faq.category] = (counts[faq.category] || 0) + 1;
        });

        var items = [{ id: "all", shortName: "All", name: "All FAQs", icon: "bi-grid" }].concat(state.categories);

        els.categories.innerHTML = items.map(function (category) {
            var isActive = category.id === state.activeCategory;
            var count = counts[category.id] || 0;

            return (
                '<button type="button" class="faq-category-btn' + (isActive ? " active" : "") + (count ? "" : " is-empty") + '"' +
                ' data-category="' + escapeHtml(category.id) + '"' +
                ' aria-pressed="' + isActive + '"' +
                ' title="' + escapeHtml(category.name) + '">' +
                '<i class="bi ' + escapeHtml(category.icon) + '" aria-hidden="true"></i>' +
                '<span class="faq-category-label">' + escapeHtml(category.shortName || category.name) + '</span>' +
                '<span class="faq-category-count" aria-label="' + count + ' questions">' + count + '</span>' +
                '</button>'
            );
        }).join("");
    }

    function renderFaqItem(faq, terms) {
        var answerId = "faq-answer-" + faq.id;
        var questionId = "faq-question-" + faq.id;

        return (
            '<div class="faq-item" id="' + escapeHtml(faq.id) + '">' +
            '<h3 class="faq-item-heading">' +
            '<button type="button" class="faq-question collapsed" id="' + escapeHtml(questionId) + '"' +
            ' data-bs-toggle="collapse" data-bs-target="#' + escapeHtml(answerId) + '"' +
            ' aria-expanded="false" aria-controls="' + escapeHtml(answerId) + '">' +
            '<span class="faq-question-text">' + highlight(faq.question, terms) + '</span>' +
            '<span class="faq-question-icon" aria-hidden="true"><i class="bi bi-chevron-down"></i></span>' +
            '</button>' +
            '</h3>' +
            '<div id="' + escapeHtml(answerId) + '" class="collapse" role="region" aria-labelledby="' + escapeHtml(questionId) + '">' +
            '<div class="faq-answer">' + renderAnswer(faq.answer, terms) + '</div>' +
            '</div>' +
            '</div>'
        );
    }

    function renderResults(visible, terms) {
        var groups = state.categories
            .map(function (category) {
                return {
                    category: category,
                    faqs: visible.filter(function (faq) { return faq.category === category.id; })
                };
            })
            .filter(function (group) { return group.faqs.length; });

        els.results.innerHTML = groups.map(function (group) {
            var category = group.category;
            return (
                '<section class="faq-group" aria-labelledby="faq-group-' + escapeHtml(category.id) + '">' +
                '<header class="faq-group-header">' +
                '<span class="faq-group-icon" aria-hidden="true"><i class="bi ' + escapeHtml(category.icon) + '"></i></span>' +
                '<div>' +
                '<h2 class="faq-group-title" id="faq-group-' + escapeHtml(category.id) + '">' + escapeHtml(category.name) + '</h2>' +
                '<p class="faq-group-description">' + escapeHtml(category.description || "") + '</p>' +
                '</div>' +
                '<span class="faq-group-count">' + group.faqs.length + (group.faqs.length === 1 ? " question" : " questions") + '</span>' +
                '</header>' +
                '<div class="faq-list">' + group.faqs.map(function (faq) { return renderFaqItem(faq, terms); }).join("") + '</div>' +
                '</section>'
            );
        }).join("");
    }

    function renderSummary(visibleCount, terms) {
        var category = state.categoryById[state.activeCategory];
        var text = visibleCount === 1 ? "1 question" : visibleCount + " questions";

        if (terms.length) {
            text += " matching “" + state.query.trim() + "”";
        }
        if (category) {
            text += " in " + category.name;
        }
        els.summary.textContent = text;
    }

    function render() {
        var terms = getTerms(state.query);
        var searchMatches = state.faqs.filter(function (faq) { return matchesQuery(faq, terms); });
        var visible = state.activeCategory === "all"
            ? searchMatches
            : searchMatches.filter(function (faq) { return faq.category === state.activeCategory; });

        renderCategories(searchMatches);
        renderResults(visible, terms);
        renderSummary(visible.length, terms);

        var isEmpty = visible.length === 0;
        els.results.hidden = isEmpty;
        els.empty.hidden = !isEmpty;
        els.clearSearch.hidden = !state.query;

        if (isEmpty) {
            els.emptyQuery.textContent = terms.length
                ? "We couldn’t find any FAQs matching “" + state.query.trim() + "”" +
                  (state.categoryById[state.activeCategory] ? " in " + state.categoryById[state.activeCategory].name : "") + "."
                : "There are no FAQs in this category yet.";
        }

        // A single search result is opened automatically.
        if (terms.length && visible.length === 1) {
            openFaq(visible[0].id, false);
        }

        writeUrlState();
    }

    function openFaq(id, scroll) {
        var panel = document.getElementById("faq-answer-" + id);
        if (!panel || !window.bootstrap) {
            return;
        }

        window.bootstrap.Collapse.getOrCreateInstance(panel, { toggle: false }).show();

        if (scroll) {
            var item = document.getElementById(id);
            if (item) {
                item.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }

    /* =========================================================
       EVENTS
    ========================================================= */

    function setQuery(value) {
        state.query = value;
        render();
    }

    function bindEvents() {
        els.search.addEventListener("input", function () {
            setQuery(els.search.value);
        });

        els.search.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && els.search.value) {
                event.preventDefault();
                els.search.value = "";
                setQuery("");
            }
        });

        els.clearSearch.addEventListener("click", function () {
            els.search.value = "";
            setQuery("");
            els.search.focus();
        });

        els.categories.addEventListener("click", function (event) {
            var button = event.target.closest("[data-category]");
            if (!button) {
                return;
            }
            state.activeCategory = button.getAttribute("data-category");
            render();
        });

        els.emptyReset.addEventListener("click", function () {
            els.search.value = "";
            state.query = "";
            state.activeCategory = "all";
            render();
            els.search.focus();
        });

        // "/" focuses the search box (ignored while typing in a field).
        document.addEventListener("keydown", function (event) {
            var tag = (event.target.tagName || "").toLowerCase();
            if (event.key === "/" && tag !== "input" && tag !== "textarea" && tag !== "select" && !event.target.isContentEditable) {
                event.preventDefault();
                els.search.focus();
            }
        });
    }

    /* =========================================================
       INIT
    ========================================================= */

    function init(data) {
        // Read before render(): writeUrlState() replaces the URL without the hash.
        var deepLinkId = decodeURIComponent((window.location.hash || "").slice(1));

        state.categories = (data.categories || []).slice().sort(byOrder);
        state.categories.forEach(function (category) {
            state.categoryById[category.id] = category;
        });

        state.faqs = (data.faqs || [])
            .filter(function (faq) { return state.categoryById[faq.category]; })
            .sort(byOrder)
            .map(function (faq) {
                faq._index = buildSearchIndex(faq);
                return faq;
            });

        readUrlState();
        bindEvents();
        render();
        root.setAttribute("aria-busy", "false");

        // Deep link to a single question, e.g. /Help/Index#stop-create
        if (deepLinkId) {
            openFaq(deepLinkId, true);
        }
    }

    FaqDataSource.load()
        .then(init)
        .catch(function (error) {
            console.error("Unable to load FAQs:", error);
            root.setAttribute("aria-busy", "false");
            els.results.hidden = true;
            els.empty.hidden = false;
            els.emptyQuery.textContent = "Help articles could not be loaded right now. Please refresh the page and try again.";
        });
})(window, document);
