import state_io from "../utils/state_io.js";
import { SubPub } from "../utils/subpub.js";

export default {}

;(() => {

    SubPub.subscribe({
        event: "render_user_addQuiz_page",
        listener: render
    });

})();

function render ( { container } ) {
    container.classList.add("editor_quiz");

    let list_dom = document.createElement("ul");
    container.appendChild(list_dom);

    for (let i = 0; i < 4; i++) {
        let page = document.createElement("li");
        page.classList.add("quiz_pageUserQuiz");
        list_dom.append(page);

        render_page(page, i);
    }
}

function render_page (page, index) {
    if (index === 0) {
        page.id = `quiz_page_id_head`;
        page.innerHTML = `
            <div> 
                <label> Questions </label>
            </div>
            <div> 
                <label> Options </label>
            </div>
        `
    } else {
        page.id = `quiz_page_id_${index}`;
        page.classList.add("studentQuizPage");
        page.innerHTML = `
            <div class="question">
                <textarea class="textArea${index} questionQuizStudent"></textarea>
            </div>
            <div class="options${index} userOptions">
                <ul class="optionsQuizStudent"></ul>
            </div>
        `
        for (let i = 0; i < 4; i++) {
            let option = document.createElement("div");
            option.classList.add("option_item");
            document.querySelector(`.options${index} > ul`).append(option);

            render_option(option);
        }

        //Unchecks the old chosen option
        let allCheckBoxes = page.querySelectorAll(".optionsQuizStudent div input");
        allCheckBoxes.forEach(checkBox => {
            checkBox.addEventListener("click", ()=>{
                allCheckBoxes.forEach(box => {
                    if(checkBox != box){
                        box.checked = false;
                    }
                })
            })
        });
    }
}

function render_option (option) {
    option.innerHTML = `
        <div>
            <input type="checkbox">
        </div>
        <div>
            <textarea class="quizStudentAnswer"></textarea>
        </div>
    `;
}