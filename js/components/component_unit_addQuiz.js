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
        let nextQustionId = parseInt(state_io.state.quiz_questions[state_io.state.quiz_questions.length - 1].quiz_question_id);
        let lastOptionId = parseInt(state_io.state.quiz_options[state_io.state.quiz_options.length - 1].quiz_option_id);
        let counter = 0; 

        let questionsQuizArray = [];
        let questionsOptionsArray = [];

        let studentQuizPages = document.querySelectorAll(".studentQuizPage"); 

        let checkAllPages = Array.from(studentQuizPages).every(page => page.querySelector("textarea").value !== "");

        let optionSelected = []; 
        let optionCheckedValues; 

        Array.from(studentQuizPages).forEach(option => {
            let checkOption = option.querySelectorAll(".optionsQuizStudent > div"); 

            optionCheckedValues = Array.from(checkOption).every(option => option.querySelector("textarea").value !== "");

            optionSelected.push(Array.from(checkOption).some(option => option.querySelector("input[type='checkbox']").checked));
        });

        let everyQuestionHasCheckedOption = optionSelected.every(option => option);

        if (checkAllPages && optionCheckedValues && everyQuestionHasCheckedOption) { 

            studentQuizPages.forEach(page => {
                nextQustionId++; 
                counter++;
    
                let textArea = page.querySelector("textarea");
                let checkOption = page.querySelectorAll(".optionsQuizStudent > div"); 
                
                let quizQuestion = {
                    chapter_id: element.chapter_id,
                    question: textArea.value,
                    quiz_question_id: nextQustionId.toString(),
                    section_id: element.section_id,
                    unit_id: element.unit_id,
                    spot: counter
                } 
    

                questionsQuizArray.push(quizQuestion);
                // SubPub.publish({
                //     event: "db::post::quiz_question::request",
                //     detail: { params: { unit: quizQuestion } }
                // }); 

                SubPub.publish({
                    event: "db::post::quiz_question::request",
                    detail: { params: { unit: quizQuestion } }
                }); 

    
                let optionsQuiz = {
                    chapter_id: element.chapter_id,
                    correct: false,
                    quiz_option_id: 0,
                    quiz_question_id: nextQustionId.toString(),
                    section_id: element.section_id,
                    unit_id: element.unit_id,
                    option: "",
                } 


                // checkOption.forEach(option => {
                //     SubPub.publish({
                //         event: "db::post::quiz_option::request",
                //         detail: { params: { question: quizQuestion } }
                //     });
                // });

                checkOption.forEach(option => {
                    SubPub.publish({
                        event: "db::post::quiz_option::request",
                        detail: { params: { question: quizQuestion } }
                    });
                });

                setTimeout(() => {
                    checkOption.forEach(option => {
                        lastOptionId++; 
                        optionsQuiz.quiz_option_id = lastOptionId.toString();
        
                        optionsQuiz.option = option.childNodes[3].firstElementChild.value; 
        
                        console.log(option.childNodes[1].firstElementChild.checked);
                        if (option.childNodes[1].firstElementChild.checked) {
                            optionsQuiz.correct = true;
                        } else {
                            optionsQuiz.correct = false;
                        }

                        
                        questionsOptionsArray.push(optionsQuiz);
                        // SubPub.publish({
                        //     event: "db::patch::quiz_option::request",
                        //     detail: { params: { option: optionsQuiz } }
                        // });

        
                        SubPub.publish({
                            event: "db::patch::quiz_option::request",
                            detail: { params: { option: optionsQuiz } }
                        });

        
                    });
                }, 2000);
            });


            SubPub.publish({
                event: "db::post::units_quizs_questions::request",
                detail: { params: { 
                    questions: questionsQuizArray,
                    options: questionsOptionsArray
                    }
                }
            });

        } else {
            
            console.log("not question enterd");

        }
    }
}

