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

    container_edit.innerHTML = `
        <h2>Quiz questions: ${element.name}, (${element.kind}). ${element_kind}_ID: ${element_id}</h2>
        <ul></ul>
        <div class="buttons control">
            <button class="button_save userQuiz_save"> Add quiz & Close </button>
            <button class="button_close"> Close </button>
        </div>
    `;

    let list_container = container_edit.querySelector("ul");

    let container = document.createElement("div");
    container.classList.add("editor_item");
    list_container.append(container);

    SubPub.publish({
        event: "render_user_addQuiz_page",
        detail: {
            container: container
        }
    });

    container_edit.querySelector(".button_close").addEventListener("click", (e) => {
        document.querySelector("#editor").classList.add("hidden");
        let checkBox = document.querySelector(".studentCheckBox");
        checkBox.checked = false;
    });

    container_edit.querySelector(".userQuiz_save").addEventListener("click", update); 

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

    console.log(state_io.state);

    function update () {
          
        let lastQuestionId = parseInt(state_io.state.quiz_questions[state_io.state.quiz_questions.length - 1].quiz_question_id);
        let lastOptionId = parseInt(state_io.state.quiz_options[state_io.state.quiz_options.length - 1].quiz_option_id);
        let counter = 0; 

        let studentQuizPages = document.querySelectorAll(".studentQuizPage"); 

        let checkAllPages = Array.from(studentQuizPages).every(page => page.querySelector("textarea").value !== "");

        let questionsQuizArray = [];
        let questionsOptionsArray = [];

        let optionSelected = []; 
        let optionCheckedValues; 
        let checkOption;

        Array.from(studentQuizPages).forEach(option => {
            checkOption = option.querySelectorAll(".optionsQuizStudent > div"); 

            optionCheckedValues = Array.from(checkOption).every(option => option.querySelector("textarea").value !== "");

            optionSelected.push(Array.from(checkOption).some(option => option.querySelector("input[type='checkbox']").checked));
        });

        let everyQuestionHasCheckedOption = optionSelected.every(option => option);

        if (checkAllPages && optionCheckedValues && everyQuestionHasCheckedOption) { 

            checkOption = document.querySelectorAll(".optionsQuizStudent > div"); 

            studentQuizPages.forEach(page => {
                lastQuestionId++; 
                counter++;
    
                let textArea = page.querySelector("textarea");

                let quizQuestion = {
                    chapter_id: element.chapter_id,
                    question: textArea.value,
                    quiz_question_id: lastQuestionId.toString(),
                    section_id: element.section_id,
                    unit_id: element.unit_id,
                    spot: counter,
                } 

                questionsQuizArray.push(quizQuestion);
            });

            for (let i = 0; i < checkOption.length; i++) {
                const option = checkOption[i];

                let optionsQuiz = {
                    chapter_id: element.chapter_id,
                    correct: false,
                    quiz_option_id: 0,
                    quiz_question_id: 0,
                    section_id: element.section_id,
                    unit_id: element.unit_id,
                    option: "",
                } 

                lastOptionId++; 

                if(i <= 3){
                    optionsQuiz.quiz_question_id = questionsQuizArray[0].quiz_question_id;
                }else if(i > 3 && i < 8){
                    optionsQuiz.quiz_question_id = questionsQuizArray[1].quiz_question_id;
                }else{
                    optionsQuiz.quiz_question_id = questionsQuizArray[2].quiz_question_id;
                }

                optionsQuiz.quiz_option_id = lastOptionId.toString();
    
                optionsQuiz.option = option.childNodes[3].firstElementChild.value; 
    
                if (option.childNodes[1].firstElementChild.checked) {
                    optionsQuiz.correct = true;
                } else {
                    optionsQuiz.correct = false;
                }

                questionsOptionsArray.push(optionsQuiz);
            }
            
            SubPub.publish({
                event: "db::post::units_quizs_questions::request",
                detail: { params: { 
                    questions: questionsQuizArray,
                    options: questionsOptionsArray,
                    course_id:element.course_id
                    }
                }
            });

        } else {
            console.log("not question enterd");
        }
    }
}

