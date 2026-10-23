/*
 * Global form validation (loaded by Views/Shared/_Layout.cshtml, _Layout1.cshtml and the Login page).
 *
 * Every text-like field gets:
 *   - trimming (and repeated spaces collapsed in names) when the user leaves the field and before save
 *   - a "required" check that also rejects whitespace-only values
 *   - minlength / maxlength (a default maxlength is added when a field has none)
 *   - a content rule, so a value can never be only special characters and names take no symbols
 *   - the field's own pattern / min / max attributes
 *
 * The rule comes from data-validate="..." when present, otherwise it is inferred from the field's
 * id, name, placeholder and label (see inferRule). Use data-validate="none" to opt a field out.
 *
 * Checks run:
 *   - on every form submit, before the page's own submit handlers (capture phase)
 *   - on click of a save-type button inside a modal, offcanvas or form (pages that save with AJAX)
 *   - when the user leaves a field, so the message shows early
 *   - from page code:  if (!SBFormLength.validate(fieldOrContainer)) { return; }
 */
(function (window, document) {
    "use strict";

    var FIELD_SELECTOR = "input, textarea";
    var SKIPPED_TYPES = /^(hidden|checkbox|radio|submit|button|reset|image|file|color|range|date|datetime-local|time|month|week)$/;
    var DEFAULT_MAX = { input: 100, textarea: 500 };
    var HTML_CHARS = /[<>]/;
    var HAS_ALNUM = /[A-Za-z0-9]/;
    var HAS_LETTER = /[A-Za-z]/;

    /*
     * pattern:   the whole value must match
     * allowed:   characters stripped while typing (only for strict rules)
     * letter:    value must contain a letter, not only digits/symbols
     */
    var RULES = {
        personName: {
            pattern: /^[A-Za-z][A-Za-z .'-]*$/,
            allowed: /[^A-Za-z .'-]/g,
            collapse: true,
            maxLength: 100,
            message: "Use letters only (spaces, dot, apostrophe and hyphen are allowed)."
        },
        title: {
            pattern: /^[A-Za-z0-9][A-Za-z0-9 .,'&()\/#:_-]*$/,
            collapse: true,
            message: "Use letters and numbers (allowed symbols: . , ' & ( ) / # : _ -), starting with a letter or number."
        },
        code: {
            pattern: /^[A-Za-z0-9][A-Za-z0-9\/._-]*$/,
            allowed: /[^A-Za-z0-9\/._-]/g,
            message: "Use letters and numbers only (allowed symbols: / . _ -), without spaces."
        },
        alnumSpace: {
            pattern: /^[A-Za-z0-9][A-Za-z0-9 -]*$/,
            allowed: /[^A-Za-z0-9 -]/g,
            collapse: true,
            message: "Use letters, numbers, spaces and hyphens only."
        },
        letters: {
            pattern: /^[A-Za-z]+$/,
            allowed: /[^A-Za-z]/g,
            message: "Use letters only (no numbers, spaces or symbols)."
        },
        username: {
            pattern: /^[A-Za-z0-9][A-Za-z0-9._@-]*$/,
            allowed: /[^A-Za-z0-9._@-]/g,
            message: "Use letters and numbers only (allowed symbols: . _ @ -), without spaces."
        },
        email: {
            pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/,
            allowed: /\s/g,
            message: "Enter a valid email address, e.g. name@example.com."
        },
        mobile: {
            pattern: /^[6-9][0-9]{9}$/,
            allowed: /[^0-9]/g,
            message: "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9."
        },
        phone: {
            pattern: /^\+?[0-9]{10,15}$/,
            allowed: /[^0-9+]/g,
            message: "Enter a valid phone number (10 to 15 digits, optional leading +)."
        },
        digits: {
            pattern: /^[0-9]+$/,
            allowed: /[^0-9]/g,
            message: "Use digits only."
        },
        decimal: {
            pattern: /^[0-9]+(\.[0-9]{1,2})?$/,
            allowed: /[^0-9.]/g,
            message: "Enter a valid number (up to 2 decimal places)."
        },
        hex8: {
            pattern: /^[0-9A-Fa-f]{8}$/,
            allowed: /[^0-9A-Fa-f]/g,
            message: "Enter exactly 8 characters using 0-9 and A-F."
        },
        bloodGroup: {
            pattern: /^(A|B|AB|O)[+-]$/i,
            allowed: /[^ABOabo+-]/g,
            upper: true,
            message: "Enter a valid blood group, e.g. A+, O-, AB+."
        },
        address: {
            pattern: /^[A-Za-z0-9][A-Za-z0-9 .,'&()\/#:;\r\n-]*$/,
            letter: true,
            collapse: true,
            maxLength: 250,
            message: "Use letters and numbers (allowed symbols: . , ' & ( ) / # : ; -), starting with a letter or number."
        },
        latitude: { min: -90, max: 90, message: "Latitude must be between -90 and 90." },
        longitude: { min: -180, max: 180, message: "Longitude must be between -180 and 180." },
        // Free text: any characters except < >, but must contain a letter or number.
        text: { message: "" },
        none: null
    };

    function labelText(field) {
        var label = field.labels && field.labels[0];
        if (!label) {
            var group = field.closest(".form-group, .mb-3, [class*='col-']");
            label = group && group.querySelector("label");
        }
        return label ? label.textContent : "";
    }

    function inferRule(field) {
        var explicit = field.getAttribute("data-validate");
        if (explicit) {
            return RULES.hasOwnProperty(explicit) ? explicit : "text";
        }

        var type = (field.getAttribute("type") || "").toLowerCase();
        var key = [field.id, field.name, field.getAttribute("placeholder"), labelText(field)]
            .join(" ").replace(/\s+/g, " ").toLowerCase();
        var max = parseInt(field.getAttribute("maxlength"), 10);

        if (/latitude|(^|[ _])lat\b|stoplat|pick_lat|drop_lat/.test(key)) return "latitude";
        if (/longitude|(^|[ _])(lng|long)\b|stoplng|pick_lng|drop_lng/.test(key)) return "longitude";
        if (type === "number") return "";
        if (type === "email" || /e-?mail/.test(key)) return "email";
        if (/\botp\b|otp/.test(key)) return "digits";
        if (type === "tel" || /mobile|phone|emergency|contact n/.test(key)) return max === 10 ? "mobile" : "phone";
        if (/rf[ _-]?id/.test(key)) return max === 8 ? "hex8" : "code";
        if (/amount|price|cost|odometer|work hour|distance/.test(key)) return "decimal";
        if (/^\s*(min|max|count|limit)\s*$/i.test(field.getAttribute("placeholder") || "")) return "decimal";
        if (/username|user name|login/.test(key)) return "username";
        if (/blood/.test(key)) return "bloodGroup";
        if (/licen[cs]e|dlno/.test(key)) return "alnumSpace";
        if (/admission|emp_code|employee code|card ?n|stop ?id|ref ?n|\bcode\b/.test(key)) return "code";
        if (/division|section/.test(key)) return "letters";
        if (/\bclass|class_/.test(key)) return "alnumSpace";
        if (/address|street/.test(key)) return "address";
        if (/(first|last|full|student|parent|father|mother|driver|teacher|visitor|staff)[ _]?name|(^|[ _])name\b/.test(key) &&
            !/route|stop|event|holiday|company|command|file|anchor|roll|user/.test(key)) return "personName";
        if (/route|stop|event|holiday|company|command|title|subject/.test(key)) return "title";
        return "text";
    }

    function isSkipped(field) {
        var type = (field.getAttribute("type") || "text").toLowerCase();
        if (SKIPPED_TYPES.test(type) || type === "search" || type === "password") return true;
        if (field.disabled || field.readOnly) return true;
        if (field.getAttribute("data-validate") === "none") return true;
        // Live search / filter boxes are not form data.
        var key = (field.id + " " + (field.getAttribute("placeholder") || "")).toLowerCase();
        return /search/.test(key);
    }

    function isPassword(field) {
        return (field.getAttribute("type") || "").toLowerCase() === "password";
    }

    function ensureMaxLength(field) {
        if (isSkipped(field)) return;
        // Names and addresses always use their rule's limit, whatever the markup says.
        var rule = RULES[inferRule(field)];
        if (rule && rule.maxLength) {
            field.setAttribute("maxlength", rule.maxLength);
            return;
        }
        if (field.hasAttribute("maxlength")) return;
        var type = (field.getAttribute("type") || "").toLowerCase();
        if (type === "number") return;
        field.setAttribute("maxlength", field.tagName === "TEXTAREA" ? DEFAULT_MAX.textarea : DEFAULT_MAX.input);
    }

    function trimField(field, ruleName) {
        if (isPassword(field) || field.disabled || field.readOnly) return;
        var rule = RULES[ruleName];
        var value = field.value;
        var trimmed = value.trim();
        if (rule && rule.collapse) {
            trimmed = field.tagName === "TEXTAREA"
                ? trimmed.replace(/[ \t]{2,}/g, " ")
                : trimmed.replace(/\s{2,}/g, " ");
        }
        if (rule && rule.upper) trimmed = trimmed.toUpperCase();
        if (trimmed !== value) field.value = trimmed;
    }

    function fieldError(field, checkRequired) {
        if (isSkipped(field)) {
            // Passwords still get required / length checks, but are never trimmed or pattern-checked.
            if (!isPassword(field) || field.disabled || field.readOnly) return "";
        }

        var type = (field.getAttribute("type") || "").toLowerCase();
        var raw = field.value;
        var value = isPassword(field) ? raw : raw.trim();

        if (type === "number" && field.validity && field.validity.badInput) {
            return "Enter a valid number.";
        }

        if (value.length === 0) {
            return checkRequired && field.required
                ? (raw.length ? "This field cannot be only spaces." : "This field is required.")
                : "";
        }

        var min = parseInt(field.getAttribute("minlength"), 10);
        var max = parseInt(field.getAttribute("maxlength"), 10);
        if (min > 0 && value.length < min) {
            return "Please enter at least " + min + " characters (you entered " + value.length + ").";
        }
        if (max > 0 && value.length > max) {
            return "Please enter no more than " + max + " characters (you entered " + value.length + ").";
        }

        if (isPassword(field)) return "";

        var ruleName = inferRule(field);
        var rule = RULES[ruleName];

        if (type === "number" || ruleName === "latitude" || ruleName === "longitude") {
            var number = Number(value);
            if (!isFinite(number)) return "Enter a valid number.";
            var minAttr = field.getAttribute("min"), maxAttr = field.getAttribute("max");
            var lower = minAttr !== null && minAttr !== "" ? Number(minAttr) : (rule && rule.min !== undefined ? rule.min : 0);
            var upper = maxAttr !== null && maxAttr !== "" ? Number(maxAttr) : (rule && rule.max !== undefined ? rule.max : Infinity);
            if (number < lower) return rule && rule.message ? rule.message : "Value cannot be less than " + lower + ".";
            if (number > upper) return rule && rule.message ? rule.message : "Value cannot be more than " + upper + ".";
            return "";
        }

        if (HTML_CHARS.test(value)) return "The characters < and > are not allowed.";
        if (!HAS_ALNUM.test(value)) return "Please enter letters or numbers, not only special characters.";

        if (rule) {
            if (rule.pattern && !rule.pattern.test(value)) return rule.message;
            if (rule.letter && !HAS_LETTER.test(value)) return "Please include at least one letter.";
        }

        var pattern = field.getAttribute("pattern");
        if (pattern) {
            try {
                if (!new RegExp("^(?:" + pattern + ")$").test(value)) {
                    return field.getAttribute("title") || (rule && rule.message) || "Please match the requested format.";
                }
            } catch (e) { /* ignore an invalid pattern attribute */ }
        }

        return "";
    }

    function messageHost(field) {
        return field.closest(".input-group") || field;
    }

    // Only clears messages set here, so other validation on the page keeps its own messages.
    function markField(field, message) {
        var host = messageHost(field);
        var note = host.nextElementSibling && host.nextElementSibling.classList.contains("sb-validation-msg")
            ? host.nextElementSibling : null;

        if (message) {
            field.setCustomValidity(message);
            field.setAttribute("data-length-invalid", "true");
            field.classList.add("is-invalid");
            if (!note) {
                note = document.createElement("div");
                note.className = "invalid-feedback d-block sb-validation-msg";
                note.setAttribute("role", "alert");
                host.insertAdjacentElement("afterend", note);
            }
            note.textContent = message;
        } else if (field.hasAttribute("data-length-invalid")) {
            field.setCustomValidity("");
            field.removeAttribute("data-length-invalid");
            field.classList.remove("is-invalid");
            if (note) note.remove();
        }
    }

    function isVisible(field) {
        return field.offsetParent !== null || field.getClientRects().length > 0;
    }

    function fieldsIn(target) {
        if (!target) return [];
        if (target.matches && target.matches(FIELD_SELECTOR)) return [target];
        return Array.prototype.slice.call(target.querySelectorAll(FIELD_SELECTOR));
    }

    // Trims and checks one field or every field inside a container; shows every problem and focuses the first.
    function validate(target) {
        var firstInvalid = null;

        fieldsIn(target).forEach(function (field) {
            if (!isVisible(field)) return;
            if (!isSkipped(field)) {
                ensureMaxLength(field);
                trimField(field, inferRule(field));
            }

            var message = fieldError(field, true);
            markField(field, message);

            if (message && !firstInvalid) firstInvalid = field;
        });

        if (firstInvalid) {
            firstInvalid.focus();
            firstInvalid.reportValidity();
            return false;
        }

        return true;
    }

    document.addEventListener("submit", function (event) {
        if (event.target.hasAttribute && event.target.hasAttribute("data-skip-validation")) return;
        if (!validate(event.target)) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);

    /*
     * Pages that save with AJAX from a button click: check the surrounding modal / offcanvas / form first.
     * Only buttons that save (Save, Submit, Update, Create, Send, Register, Add in a footer) are guarded.
     */
    var SAVE_TEXT = /\b(save|submit|update|create|send|register)\b/i;
    document.addEventListener("click", function (event) {
        var button = event.target.closest && event.target.closest("button, input[type=button], a.btn");
        if (!button || button.disabled || button.hasAttribute("data-skip-validation")) return;
        if (button.type === "submit" && button.form) return; // handled by the submit listener

        var text = (button.textContent || button.value || "") + " " + (button.id || "");
        var inFooter = !!button.closest(".modal-footer, .offcanvas-footer, .report-drawer-footer, form");
        if (!SAVE_TEXT.test(text) && !(inFooter && /\badd\b/i.test(text))) return;
        if (/search|filter|cancel|close|reset|back|clear/i.test(text)) return;

        var scope = button.closest("[data-validate-scope], form, .modal, .offcanvas");
        if (!scope || scope.hasAttribute("data-skip-validation")) return;

        if (!validate(scope)) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);

    document.addEventListener("focusin", function (event) {
        var field = event.target;
        if (field.matches && field.matches(FIELD_SELECTOR)) ensureMaxLength(field);
    });

    document.addEventListener("focusout", function (event) {
        var field = event.target;
        if (!(field.matches && field.matches(FIELD_SELECTOR)) || isSkipped(field)) return;
        trimField(field, inferRule(field));
        markField(field, fieldError(field, false));
    });

    // Strict rules drop characters that can never be valid while the user types or pastes.
    document.addEventListener("input", function (event) {
        var field = event.target;
        if (!(field.matches && field.matches(FIELD_SELECTOR)) || isSkipped(field)) return;

        var rule = RULES[inferRule(field)];
        if (rule && rule.allowed) {
            var cleaned = field.value.replace(rule.allowed, "");
            if (cleaned !== field.value) {
                var position = field.selectionStart - (field.value.length - cleaned.length);
                field.value = cleaned;
                try { field.setSelectionRange(position, position); } catch (e) { /* not supported for this type */ }
            }
        }

        // Names and addresses never go past their limit, even when the markup has no maxlength.
        if (rule && rule.maxLength && field.value.length > rule.maxLength) {
            ensureMaxLength(field);
            field.value = field.value.slice(0, rule.maxLength);
        }

        if (field.hasAttribute("data-length-invalid")) markField(field, fieldError(field, false));
    });

    window.SBFormLength = { validate: validate, ruleFor: inferRule };
    window.SBFormValidation = window.SBFormLength;
})(window, document);
