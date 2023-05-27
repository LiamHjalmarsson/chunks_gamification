import state_io from "../utils/state_io.js";
import { SubPub } from "../utils/subpub.js";

export default {}

;(() => {

    SubPub.subscribe({
        event: "render_unit_quiz",
        listener: render
    });
    
})();

//Lägg till en nyckel "questionCounter" i varje unit som räknar antal fråga användaren svarat
//Istället att ha en global variabel "counter" och för att ifall använder stänger sidan och vill fortsätta på quizet 
//Och att inte starta från början - användaren som stängt sidan och vill fortsätta med quizet
//Vilket ska vara högst 3

let counter = 0;

function render(arg) {
    counter = state_io.state.quiz_answers.filter(answer => answer.unit_id == arg.unitID).length;

    if(counter < 3){
      let modalVideoContent = document.querySelector("#modal > .content");
      modalVideoContent.style.display = "none";
  
      document.getElementById("modal").classList.add("flex");
  
      let quizContainer = document.createElement("div");
      quizContainer.classList.add("quizContainer");
  
      let headerContainer = document.createElement("div");
      headerContainer.classList.add("headerContainer");
  
      let closeQuizButton = document.createElement("button");
      closeQuizButton.id = "closeQuizButton";
      closeQuizButton.classList.add("button");
      closeQuizButton.innerText = "Close";
  
      closeQuizButton.addEventListener("click", ()=>{
          quizContainer.remove();
  
          modalVideoContent.style.display = "flex";
          document.getElementById("modal").classList.remove("flex");
      });
  
      let unitName = document.createElement("h2");
      unitName.classList.add("unitName");
      unitName.innerText = state_io.state.units.find(u => u.unit_id = arg.unitID).name;
  
      let streakP = document.createElement("p");
      streakP.classList.add("currentStreak");
      streakP.innerText = state_io.state.user.current_streak;

      let questionContainer = document.createElement("div");
      questionContainer.classList.add("questionContainer");
  
      let optionsContainer = document.createElement("div");
      optionsContainer.classList.add("optionsContainer");
      
      optionsContainer.innerHTML = "";
      questionContainer.innerHTML = "";
  
      renderNewQuestion(arg.unitID, optionsContainer, questionContainer);
  
      questionContainer.append(optionsContainer);
      headerContainer.append(closeQuizButton, unitName, streakP);
      quizContainer.append(headerContainer, questionContainer);
  
      document.getElementById("modal").append(quizContainer);
    }
}

function renderNewQuestion(unitID, optionsContainer, questionContainer) {
    counter++;

    optionsContainer.innerHTML = "";
    questionContainer.innerHTML = "";

    let question = getRandomQuestion(unitID);
    questionContainer.innerHTML = counter + "/3 - " + question.question;
  
    let options = state_io.state.quiz_options.filter(option => option.quiz_question_id == question.quiz_question_id);

    renderOptions(options,optionsContainer, questionContainer, unitID);
}

function getRandomQuestion(unitID) {

  let allQuestions = state_io.state.quiz_questions;
  let unitQuestions = allQuestions.filter(question => question.unit_id === unitID);

  //Checks if user already answered the question
  let usersQuizAnswers =  state_io.state.quiz_answers;
  let allIDsOfAnsweredQuestions = usersQuizAnswers.map(answer => answer.quiz_question_id);
  
  //Removes dublicates
  let answeredQuestionsIDs = [...new Set(allIDsOfAnsweredQuestions)];

  //Non-answered questions
  let nonAnsweredUnitQuestions = [];

  unitQuestions.forEach(question => {
    if(!answeredQuestionsIDs.includes(question.quiz_question_id)){
      nonAnsweredUnitQuestions.push(question);
    }
  });
  
  if(unitQuestions.length != 0){
    if (nonAnsweredUnitQuestions.length != 0){

      let randomNumber = Math.floor(Math.random() * nonAnsweredUnitQuestions.length);

      /*
        while(answeredQuestionsIDs.includes(nonAnsweredUnitQuestions[randomNumber].quiz_question_id)) {
        randomNumber = Math.floor(Math.random() * nonAnsweredUnitQuestions.length);
      }
      */

      let randomQuestion = nonAnsweredUnitQuestions[randomNumber];

      return randomQuestion;
    }else{
      return "You have already answered all the questions!";
    }
  }else{
    return "There is no question created for this Unit!";
  }
}

function renderOptions(options, optionsContainer, questionContainer, unitID) {

  for (let i = 0; i < options.length; i++) {

    const option = options[i];

    let optionButton = document.createElement("div");
    optionButton.classList.add("quizOption");
    optionButton.innerText = option.option;

    optionButton.addEventListener("click", ()=>{
        let currentStreak = state_io.state.user.current_streak;

        if(currentStreak == null){
          currentStreak = 0;
        }

        //Testa detta istället för en if-sats
        option.correct ? currentStreak++ : currentStreak = 0;
        
        SubPub.publish({
          event: "db::patch::streak::request",
          detail: { params: { currentStreak, user_id:state_io.state.user.user_id }}
        });

        SubPub.publish({
          event: "db::post::quiz_answer::request",
          detail: { params: { option, user_id: state_io.state.user.user_id }}
        });

        if(counter < 3){
          renderNewQuestion(unitID, optionsContainer, questionContainer);
        }else{
          document.getElementById("closeQuizButton").click();
        }
    })

    optionsContainer.append(optionButton);
  }

  questionContainer.append(optionsContainer);
}