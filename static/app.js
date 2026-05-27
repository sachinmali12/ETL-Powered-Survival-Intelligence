document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // DOM ELEMENTS SELECTORS
    // ==========================================================================
    const form = document.getElementById("prediction-form");
    const predictorSection = document.getElementById("predictor-section");
    const resultsSection = document.getElementById("results-section");
    const appMain = document.querySelector(".app-main");
    
    // Hidden inputs
    const inputPclass = document.getElementById("input-pclass");
    const inputSex = document.getElementById("input-sex");
    const inputEmbarked = document.getElementById("input-embarked");

    // Steppers and sliders
    const inputAge = document.getElementById("input-age");
    const inputSibSp = document.getElementById("input-sibsp");
    const inputParch = document.getElementById("input-parch");
    const inputFare = document.getElementById("input-fare");
    
    // Displays
    const fareValueDisplay = document.getElementById("fare-value-display");
    const fareTierName = document.getElementById("fare-tier-name");
    
    // Stepper buttons
    const btnAgeMinus = document.getElementById("btn-age-minus");
    const btnAgePlus = document.getElementById("btn-age-plus");
    const btnSibspMinus = document.getElementById("btn-sibsp-minus");
    const btnSibspPlus = document.getElementById("btn-sibsp-plus");
    const btnParchMinus = document.getElementById("btn-parch-minus");
    const btnParchPlus = document.getElementById("btn-parch-plus");

    // Submit button
    const btnPredict = document.getElementById("btn-predict");
    
    // Results elements
    const probabilityText = document.getElementById("probability-text");
    const outcomeBadgeText = document.getElementById("outcome-badge-text");
    const progressRingCircle = document.querySelector(".progress-ring__circle");
    
    // Verdict elements
    const verdictIcon = document.getElementById("verdict-icon");
    const verdictTitle = document.getElementById("verdict-title");
    const verdictDescription = document.getElementById("verdict-description");
    
    // Insights elements
    const insightGender = document.getElementById("insight-gender");
    const insightClass = document.getElementById("insight-class");
    const insightAge = document.getElementById("insight-age");
    const insightFamily = document.getElementById("insight-family");
    
    // Recalculate button
    const btnRecalculate = document.getElementById("btn-recalculate");

    // Circular Progress Settings
    const circleRadius = progressRingCircle.r.baseVal.value;
    const circumference = circleRadius * 2 * Math.PI;
    
    // Initialize Progress Ring stroke styling
    progressRingCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressRingCircle.style.strokeDashoffset = circumference;

    // ==========================================================================
    // CUSTOM CARD SELECTION TOGGLES
    // ==========================================================================
    
    // 1. Ticket Class Card Toggles
    const classCards = document.querySelectorAll(".class-card");
    classCards.forEach(card => {
        card.addEventListener("click", () => {
            classCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            inputPclass.value = card.getAttribute("data-class");
            // Auto update fare suggestion on class selection to make UX amazing
            updateFareSuggestion(parseInt(inputPclass.value));
        });
    });

    // 2. Gender Card Toggles
    const genderCards = document.querySelectorAll(".gender-card");
    genderCards.forEach(card => {
        card.addEventListener("click", () => {
            genderCards.forEach(g => g.classList.remove("active"));
            card.classList.add("active");
            inputSex.value = card.getAttribute("data-gender");
        });
    });

    // 3. Port of Embarkation Card Toggles
    const portCards = document.querySelectorAll(".port-card");
    portCards.forEach(card => {
        card.addEventListener("click", () => {
            portCards.forEach(p => p.classList.remove("active"));
            card.classList.add("active");
            inputEmbarked.value = card.getAttribute("data-port");
        });
    });

    // ==========================================================================
    // STEPPER CONTROLS LOGIC
    // ==========================================================================
    const configureStepper = (minusBtn, plusBtn, inputEl, min, max, step) => {
        minusBtn.addEventListener("click", () => {
            let val = parseFloat(inputEl.value) || 0;
            if (val > min) {
                inputEl.value = Math.max(min, val - step);
                inputEl.dispatchEvent(new Event("change"));
            }
        });
        plusBtn.addEventListener("click", () => {
            let val = parseFloat(inputEl.value) || 0;
            if (val < max) {
                inputEl.value = Math.min(max, val + step);
                inputEl.dispatchEvent(new Event("change"));
            }
        });
    };

    configureStepper(btnAgeMinus, btnAgePlus, inputAge, 0, 100, 1);
    configureStepper(btnSibspMinus, btnSibspPlus, inputSibSp, 0, 10, 1);
    configureStepper(btnParchMinus, btnParchPlus, inputParch, 0, 10, 1);

    // ==========================================================================
    // FARE SLIDER & TIER LOGIC
    // ==========================================================================
    const updateFareDisplay = (val) => {
        const fare = parseFloat(val);
        fareValueDisplay.textContent = `£${fare.toFixed(2)}`;
        
        // Define tiers mirroring main.py feature-band thresholds
        let tier = "";
        if (fare < 10) {
            tier = "Standard Economy (Low)";
        } else if (fare < 30) {
            tier = "Cabin / Standard (Medium)";
        } else if (fare < 80) {
            tier = "First Class / Saloon (High)";
        } else {
            tier = "Luxury Suite / VIP (Premium)";
        }
        fareTierName.textContent = tier;
    };

    const updateFareSuggestion = (pclass) => {
        // Suggest historical average fares based on selected class
        let suggestedFare = 15;
        if (pclass === 1) suggestedFare = 85;
        else if (pclass === 2) suggestedFare = 22;
        else suggestedFare = 8;
        
        inputFare.value = suggestedFare;
        updateFareDisplay(suggestedFare);
    };

    inputFare.addEventListener("input", (e) => {
        updateFareDisplay(e.target.value);
    });

    // Initialize display with default values
    updateFareDisplay(inputFare.value);

    // ==========================================================================
    // PROGRESS GAUGE ANIMATION
    // ==========================================================================
    const setProgress = (percent) => {
        const offset = circumference - (percent / 100) * circumference;
        progressRingCircle.style.strokeDashoffset = offset;
    };

    // Counting percentage numerical effect
    const animatePercentage = (targetPercent) => {
        let currentPercent = 0.0;
        const duration = 1200; // ms
        const stepTime = 16; // ~60fps
        const totalSteps = duration / stepTime;
        const increment = targetPercent / totalSteps;

        const counter = setInterval(() => {
            currentPercent += increment;
            if (currentPercent >= targetPercent) {
                probabilityText.textContent = `${targetPercent.toFixed(2)}%`;
                clearInterval(counter);
            } else {
                probabilityText.textContent = `${currentPercent.toFixed(2)}%`;
            }
        }, stepTime);
    };

    // ==========================================================================
    // INSIGHTS & VERDICT ENGINE
    // ==========================================================================
    const generateInsights = (pclass, sex, age, sibsp, parch, survived, prob) => {
        // Class Label
        let classLabel = "";
        if (pclass === 1) classLabel = "First Class (Favorable)";
        else if (pclass === 2) classLabel = "Second Class (Moderate)";
        else classLabel = "Third Class (Disadvantage)";
        insightClass.textContent = classLabel;

        // Gender Label
        let genderLabel = "";
        if (sex === "female") genderLabel = "Favorable (Women & Children First)";
        else genderLabel = "Male Protocol (Lower Priority)";
        insightGender.textContent = genderLabel;

        // Age Label
        let ageLabel = `${age} yrs `;
        if (age <= 12) ageLabel += "(Child Priority)";
        else if (age <= 20) ageLabel += "(Teen)";
        else if (age <= 60) ageLabel += "(Adult)";
        else ageLabel += "(Senior Deck)";
        insightAge.textContent = ageLabel;

        // Family Size
        const totalFamily = sibsp + parch;
        let familyLabel = "";
        if (totalFamily === 0) familyLabel = "Single (Alone)";
        else familyLabel = `${totalFamily + 1} People (Family)`;
        insightFamily.textContent = familyLabel;

        // Custom Historic Verdict Card Summary
        let title = "";
        let description = "";
        let iconHtml = "";

        if (survived) {
            title = "Evacuation Prediction: Favorable";
            iconHtml = '<i class="fa-solid fa-circle-check"></i>';
            if (sex === "female") {
                description = `Evacuation priorities strongly favored women. As a female traveler, historical guidelines like "Women and children first" yield a high survival chance of ${prob}%.`;
            } else if (age <= 12) {
                description = `Children were evacuated early from upper decks. Young passenger age significantly boosted survival likelihood to ${prob}%.`;
            } else if (pclass === 1) {
                description = `Upper-deck passenger privilege allowed immediate access to lifeboats. Premium cabin class contributed to a high survival likelihood of ${prob}%.`;
            } else {
                description = `Despite being male/lower class, exceptional manifest variables (e.g. low family size, ticket fare location) helped beat the average odds, achieving a ${prob}% prediction.`;
            }
        } else {
            title = "Evacuation Prediction: Somber";
            iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
            if (sex === "male" && age > 12) {
                if (pclass === 3) {
                    description = `Historical manifest data highlights that adult males in third class had exceptionally low evacuation accessibility, leading to a critical ${prob}% survival forecast.`;
                } else {
                    description = `Adult male evacuation priority was limited, as maritime protocol strictly enforced "Women and children first." Predicted survival chance is restricted to ${prob}%.`;
                }
            } else if (pclass === 3) {
                description = `Lower steerage deck accommodations had restricted staircase egress routes during the vessel's sinking, resulting in a low survival estimate of ${prob}%.`;
            } else {
                description = `Aggregated manifest statistics (such as high passenger load or unfortunate embarkation parameters) indicates that evacuation odds were unfortunately unfavorable (${prob}%).`;
            }
        }

        verdictTitle.textContent = title;
        verdictDescription.textContent = description;
        verdictIcon.innerHTML = iconHtml;
    };

    // ==========================================================================
    // BACKEND API INTEGRATION (FORM SUBMIT)
    // ==========================================================================
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // 1. Enter Loading State
        btnPredict.classList.add("loading");
        btnPredict.disabled = true;

        // 2. Extract input values
        const pclassVal = parseInt(inputPclass.value);
        const sexVal = inputSex.value;
        const ageVal = parseFloat(inputAge.value);
        const sibspVal = parseInt(inputSibSp.value);
        const parchVal = parseInt(inputParch.value);
        const fareVal = parseFloat(inputFare.value);
        const embarkedVal = inputEmbarked.value;

        // Construct JSON Payload
        const payload = {
            pclass: pclassVal,
            sex: sexVal,
            age: ageVal,
            sibsp: sibspVal,
            parch: parchVal,
            fare: fareVal,
            embarked: embarkedVal
        };

        try {
            // 3. POST Fetch request to relative backend URL
            const response = await fetch("/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error("HTTP error occurred. Please verify backend state.");
            }

            const data = await response.json();
            
            // Extract prediction properties
            const survived = data.prediction.includes("Survived");
            const probabilityStr = data.survival_probability.replace("%", "");
            const probabilityNum = parseFloat(probabilityStr);

            // 4. Update Result Card Layout and Themes
            if (survived) {
                resultsSection.className = "results-card card-glow survived-theme";
            } else {
                resultsSection.className = "results-card card-glow fatal-theme";
            }
            
            outcomeBadgeText.textContent = data.prediction;
            
            // Show Results panel and enable full side-by-side grid
            resultsSection.classList.remove("hidden");
            appMain.classList.add("has-results");

            // 5. Trigger animations
            setProgress(probabilityNum);
            animatePercentage(probabilityNum);
            
            // Render textual insights
            generateInsights(
                pclassVal, 
                sexVal, 
                ageVal, 
                sibspVal, 
                parchVal, 
                survived, 
                data.survival_probability
            );

            // 6. Smooth Scroll to the results container
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 300);

        } catch (error) {
            console.error("Simulation error:", error);
            alert("Simulation failed: Unable to establish stable contact with the prediction server. Please make sure the FastAPI server is running.");
        } finally {
            // 7. Reset submit button state
            btnPredict.classList.remove("loading");
            btnPredict.disabled = false;
        }
    });

    // ==========================================================================
    // MODIFY MANIFEST (RESET LOGIC)
    // ==========================================================================
    btnRecalculate.addEventListener("click", () => {
        // Smoothly hide results container
        resultsSection.style.animation = "revealCard var(--transition-normal) reverse forwards";
        
        setTimeout(() => {
            resultsSection.classList.add("hidden");
            appMain.classList.remove("has-results");
            resultsSection.style.animation = ""; // reset animation
            predictorSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
    });
});
