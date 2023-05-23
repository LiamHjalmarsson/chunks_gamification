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

function render() {
    let quizContainer = document.createElement("div");
    quizContainer.classList.add("quizContainer");

    let headerContainer = document.createElement("div");
    headerContainer.classList.add("headerContainer");

    let closeQuizButton = document.createElement("button");
    closeQuizButton.classList.add("button");
    closeQuizButton.innerText = "Close";

    closeQuizButton.addEventListener("click", ()=>{
        quizContainer.remove();
        counter = 0;
    });

    let unitName = document.createElement("h3");
    unitName.classList.add("unitName");
    unitName.innerText = "unit name";

    let currentStreak = document.createElement("p");
    //currentStreak.innerText = state_io.state.user.currentStreak;
    currentStreak.classList.add("currentStreak");

    let questionContainer = document.createElement("div");
    questionContainer.classList.add("questionContainer");

    let optionsContainer = document.createElement("div");
    optionsContainer.classList.add("optionsContainer");
    
    renderNewQuestion(unitID);

    questionContainer.append(optionsContainer);
    headerContainer.append(closeQuizButton, unitName, currentStreak);
    quizContainer.append(headerContainer, questionContainer);

    document.body.append(quizContainer);
}

function renderNewQuestion(unitID) {
    counter++;

    let optsContainer = document.getElementsByClassName("optionsContainer");
    optsContainer.innerHTML = "";

    let qsContainer = document.getElementsByClassName("questionContainer");
    qsContainer.innerHTML = "";

    let question = getRandomQuestion(unitID);
    let questionName = counter + "/3 - " + question.question;
    
    let options = question.options;

    for (let i = 0; i < options.length; i++) {

        const option = options[i];

        let optionButton = document.createElement("button");
        optionButton.classList.add("option");
        optionButton.innerText = option;

        option.addEventListener("click", ()=>{
            //counter++;
            let currentStreak = state_io.state.user.currentStreak;
            
            if(option.correct){
                currentStreak++;
                //Detta kan göras i api.php eller actions.php för att undvika (minska) fler förfrågningar till databasen
                /*
                //Om current streak är större, vilket blir ny rekord för användaren
                //Uppdatera databasen
                if(currentStreak > state_io.state.user.highStreak){
                    SubPub.publish({
                        event: "db::update::user_highstreak::request",
                        detail: { params: { currentStreak }}
                    });
                }
                */
            }else{
                currentStreak = 0;
            }

            //Testa detta istället för en if-sats
            //option.correct ? currentStreak++ : currentStreak = 0;
            
            document.getElementsByClassName("currentStreak").innerText = currentStreak;

            SubPub.publish({
              event: "db::update::user_currentStreak::request",
              detail: { params: { currentStreak }}
            });

            if(counter < 4){
              renderNewQuestion(unitID);
            }
        })

        optsContainer.append(option);
    }

    qsContainer.append(questionName);
}

console.log(getRandomQuestion("403"));

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