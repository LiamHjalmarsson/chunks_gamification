import state_io from "../utils/state_io.js";
import { SubPub } from "../utils/subpub.js";

export default {}

;(() => {

    SubPub.subscribe({
        event: "render_user_addQuiz_page",
        listener: render
    });

})();

function render ( { element, container_dom } ) {

    console.log(element);
    container_dom.id = "quiz_editor_id_" + element.unit_id;
    container_dom.classList.add("editor_quiz");

    let list_dom = document.createElement("ul");
    container_dom.appendChild(list_dom);

    for (let i = 0; i < 4; i++) {
        let page_dom = document.createElement("li");
        page_dom.classList.add("quiz_pageUserQuiz");
        list_dom.append(page_dom);

        render_page(page_dom, i);
    }

}

function render_page (page_dom, index) {

    if (index === 0) {
        page_dom.id = `quiz_page_id_head`;
        page_dom.innerHTML = `
            <div> 
                <label> Questions </label>
            </div>
            <div> 
                <label> Options </label>
            </div>
        `
    } else {
        page_dom.id = `quiz_page_id_${index}`;

        page_dom.innerHTML = `
            <div class="question">
                <textarea class="textArea${index}"></textarea>
            </div>
            <div class="options${index} optionsQuiz">
                <ul></ul>
            </div>
        `
        for (let i = 0; i < 4; i++) {
            let optionDom = document.createElement("div");
            optionDom.classList.add("option_item");
            document.querySelector(`.options${index} > ul`).append(optionDom);

            render_option(optionDom);
        }

        let question_textarea_dom = page_dom.querySelector(`.textArea${index}`);
        question_textarea_dom.addEventListener("change", patch_question);

        function patch_question() {

            let _question = {
                question: question_textarea_dom.value,
            };
        
        }
        
    }


}

function render_option (optionDom) {
    optionDom.innerHTML = `
        <div>
            <input type="checkbox">
        </div>
        <div>
            <textarea></textarea>
        </div>
    `
}