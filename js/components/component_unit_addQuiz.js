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

    let container_edit = document.querySelector("#editor > .content");
    let element_kind = state_io.Consts.unit_kinds.includes(element.kind) ? "unit" : element.kind;
    let element_id = element[element_kind + "_id"];

    container_edit.dataset.update_data = JSON.stringify({
        element,
        kind: element_kind,
        element_id: element_id,
    });

    console.log(container_edit);

    container_edit.innerHTML = `
        <h2>Quiz questions: ${element.name}, (${element.kind}). ${element_kind}_ID: ${element_id}</h2>
        <ul></ul>
        <div class="buttons control">
            <button class="button_save userQuiz_save"> Add quiz & Close </button>
            <button class="button_close"> Close </button>
        </div>
    `;

    // har vi 
    let list_container = container_edit.querySelector("ul");

    // har vi utan redners[componentes rad 100]
    let container = document.createElement("div");
    container.classList.add("editor_item");
    list_container.append(container);

    SubPub.publish({
        event: "render_user_addQuiz_page",
        detail: {
            element: element,
            container: container
        }
    });

    container_edit.querySelector(".button_close").addEventListener("click", (e) => {
        document.querySelector("#editor").classList.add("hidden");
        let checkBox = document.querySelector(".studentCheckBox");
        checkBox.checked = false;
    });

    container_edit.querySelector(".userQuiz_save").addEventListener("click", update); 

    // CLOSE VIA CLICK ON BACKGROUND or PRESS KEY ESC
    document.querySelector("#editor").addEventListener("click", e => {
        if (e.target.id === "editor") {
            document.querySelector("#editor").classList.add("hidden");
            let checkBox = document.querySelector(".studentCheckBox");
            checkBox.checked = false;
        };
    });

    document.querySelector("html").addEventListener("keyup", e => {
        if (e.key === "Escape" && !document.querySelector("#editor").classList.contains("hidden")) {
            document.querySelector("#editor").classList.add("hidden");
            let checkBox = document.querySelector(".studentCheckBox");
            checkBox.checked = false;
        }
    });

    function update () {
        document.querySelectorAll(".studentQuizPage").forEach(page => {
            let textArea = page.querySelector("textarea");
            let checkOption = page.querySelectorAll(".optionsQuizStudent > div"); 
            
            let optionSelected = Array.from(checkOption).some(option => option.querySelector("input[type='checkbox']").checked);
            console.log(element);
    
            if (textArea.value !== "" && optionSelected) {

                // vad behöver vi här 
                let optionsQuiz = {
                    chapter_id: element.chapter_id,
                    section_id: element.section_id,
                    unit_id: element.unit_id,
                    option: textArea.value,
                    // quiz_question_id: ???
                    // quiz_option_id: ???
                    // correct: 
                    // option: 
                } 

                console.log(optionsQuiz);
                // SubPub.publish({
                //     event: "db::post::quiz_question::request",
                //     detail: {
                //         params: {
                //         }
                //     }
                // });
            } else {
                if (textArea.value === "") {
    
                }
                if (!optionSelected) {
    
                }
            }
        });
    }
}

