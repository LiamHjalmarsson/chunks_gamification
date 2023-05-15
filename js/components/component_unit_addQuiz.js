import state_io from "../utils/state_io.js";
import { SubPub } from "../utils/subpub.js";

export default {}

;(() => {

    SubPub.subscribe({
        event: "render_user_addQuiz",
        listener: render
    });

})();

function render( { element } ) {
    document.querySelector("#editor").classList.remove("hidden");
    document.querySelector(".content").classList.remove("hidden");

    let dom = document.querySelector("#editor > .content");
    let element_kind = state_io.Consts.unit_kinds.includes(element.kind) ? "unit" : element.kind;
    let element_id = element[element_kind + "_id"];

    dom.dataset.update_data = JSON.stringify({
        element,
        kind: element_kind,
        element_id: element_id,
    });

    dom.innerHTML = `
        <h2>Quiz questions: ${element.name}, (${element.kind}). ${element_kind}_ID: ${element_id}</h2>
        <ul></ul>
        <div class="buttons control">
            <button class="button_save"> Add quiz & CLOSE </button>
            <button class="button_close">CLOSE</button>
        </div>
    `;

    dom.querySelector(".button_close").addEventListener("click", () => {
        document.querySelector("#editor").classList.add("hidden");
    });

    let list_dom = dom.querySelector("ul");

    let container_dom = document.createElement("div");
    container_dom.classList.add("editor_item");
    list_dom.append(container_dom);

    SubPub.publish({
        event: "render_user_addQuiz_page",
        detail: {
            element: element,
            container_dom: container_dom
        }
    });
}