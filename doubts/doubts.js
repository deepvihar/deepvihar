import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, query, orderBy, serverTimestamp, updateDoc, doc, increment, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDqsjSCdLR66wp8oaDUbErBumFnS4LccSQ",
  authDomain: "deepvihar-60ba7.firebaseapp.com",
  projectId: "deepvihar-60ba7",
  storageBucket: "deepvihar-60ba7.firebasestorage.app",
  messagingSenderId: "77079056276",
  appId: "1:77079056276:web:76afc69aed7d3d3f458981"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// === Profanity Filter ===
const badWordsList = ["badword1", "badword2", "idiot", "stupid", "abuse", "fake", "pagal", "gali"]; 
function containsBadWords(text) {
    const lowerText = text.toLowerCase();
    return badWordsList.some(word => lowerText.includes(word));
}

// === DOM Elements ===
const navLoginBtn = document.getElementById("nav-login-btn");
const navProfileBtn = document.getElementById("nav-profile-btn");
const navLogoutBtn = document.getElementById("nav-logout-btn");

const authModal = document.getElementById("auth-modal");
const profileModal = document.getElementById("profile-modal");
const publicProfileModal = document.getElementById("public-profile-modal");
const qModal = document.getElementById("question-modal");
const aModal = document.getElementById("answer-modal");

const openQModalBtn = document.getElementById("open-question-modal");
const authForm = document.getElementById("auth-form");

const questionsContainer = document.getElementById("questions-container");
const filterBtns = document.querySelectorAll(".filter-btn");

let isSignup = false; 
const authSwitchLink = document.getElementById("auth-switch-link");
const authSwitchText = document.getElementById("auth-switch-text");
const signupNameGroup = document.getElementById("signup-name-group");
const authTitle = document.getElementById("auth-title");
const authSubmitBtn = document.getElementById("auth-submit-btn");

let currentUserData = null;
let usersCache = {}; 

// === Auth State Change ===
onAuthStateChanged(auth, async (user) => {
    if (user) {
        navLoginBtn.style.display = "none";
        navProfileBtn.style.display = "inline-block";
        navLogoutBtn.style.display = "inline-block";
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            currentUserData = userDoc.data();
            updateProfileUI();
        }
    } else {
        currentUserData = null;
        navLoginBtn.style.display = "inline-block";
        navProfileBtn.style.display = "none";
        navLogoutBtn.style.display = "none";
    }
});

function updateProfileUI() {
    if (!currentUserData) return;
    document.getElementById("profile-name").innerText = currentUserData.name;
    document.getElementById("profile-email").innerText = currentUserData.email;
    document.getElementById("profile-likes-count").innerText = currentUserData.totalLikes || 0;
    
    const badge = document.getElementById("profile-badge");
    if ((currentUserData.totalLikes || 0) >= 100) {
        badge.innerHTML = '<i class="fas fa-check-circle blue-tick" title="Verified Achiever"></i>';
    } else {
        badge.innerHTML = '';
    }
}

async function getUserData(uid) {
    if (usersCache[uid]) return usersCache[uid];
    const d = await getDoc(doc(db, "users", uid));
    if (d.exists()) {
        usersCache[uid] = d.data();
        return usersCache[uid];
    }
    return null;
}

// === View Public User Profile ===
window.viewUserProfile = async function(uid) {
    if (!uid || uid === "undefined") {
        alert("This is an older post. User profile not available.");
        return;
    }
    
    document.getElementById("public-profile-name").innerText = "Loading...";
    document.getElementById("public-profile-badge").innerHTML = "";
    document.getElementById("public-profile-likes-count").innerText = "0";
    publicProfileModal.style.display = "block";

    try {
        let uData = await getUserData(uid);
        if (uData) {
            document.getElementById("public-profile-name").innerText = uData.name;
            document.getElementById("public-profile-likes-count").innerText = uData.totalLikes || 0;
            if ((uData.totalLikes || 0) >= 100) {
                document.getElementById("public-profile-badge").innerHTML = '<i class="fas fa-check-circle blue-tick" title="Verified Achiever"></i>';
            }
        } else {
            document.getElementById("public-profile-name").innerText = "Unknown User";
        }
    } catch (e) {
        document.getElementById("public-profile-name").innerText = "Error loading";
    }
};

// === Modal Toggles ===
navLoginBtn.onclick = (e) => { e.preventDefault(); authModal.style.display = "block"; };
navProfileBtn.onclick = (e) => { e.preventDefault(); profileModal.style.display = "block"; };
document.getElementById("close-auth-modal").onclick = () => authModal.style.display = "none";
document.getElementById("close-profile-modal").onclick = () => profileModal.style.display = "none";
document.getElementById("close-public-profile-modal").onclick = () => publicProfileModal.style.display = "none";
document.getElementById("close-q-modal").onclick = () => qModal.style.display = "none";
document.getElementById("close-a-modal").onclick = () => aModal.style.display = "none";

window.onclick = (e) => { 
    if (e.target == qModal) qModal.style.display = "none"; 
    if (e.target == aModal) aModal.style.display = "none";
    if (e.target == authModal) authModal.style.display = "none";
    if (e.target == profileModal) profileModal.style.display = "none";
    if (e.target == publicProfileModal) publicProfileModal.style.display = "none";
};

openQModalBtn.onclick = () => {
    if (!auth.currentUser) { alert("Please Login first to ask a question."); authModal.style.display = "block"; } 
    else { qModal.style.display = "block"; }
};

window.openAnswerModal = function(questionId) {
    if (!auth.currentUser) { alert("Please Login first to write an answer."); authModal.style.display = "block"; } 
    else { document.getElementById("answer-question-id").value = questionId; aModal.style.display = "block"; }
};

// === Auth Functions ===
authSwitchLink.onclick = (e) => {
    e.preventDefault();
    isSignup = !isSignup;
    if (isSignup) {
        authTitle.innerText = "Create Account";
        signupNameGroup.style.display = "block";
        authSwitchText.innerText = "Already have an account?";
        authSwitchLink.innerText = "Login";
        authSubmitBtn.innerText = "Sign Up";
    } else {
        authTitle.innerText = "Login";
        signupNameGroup.style.display = "none";
        authSwitchText.innerText = "Don't have an account?";
        authSwitchLink.innerText = "Sign Up";
        authSubmitBtn.innerText = "Login";
    }
};

authForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    
    try {
        if (isSignup) {
            const name = document.getElementById("auth-name").value;
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCred.user.uid), {
                name: name,
                email: email,
                totalLikes: 0,
                uid: userCred.user.uid
            });
            alert("Account created successfully!");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Logged in successfully!");
        }
        authModal.style.display = "none";
        authForm.reset();
    } catch (error) {
        alert("Error: " + error.message);
    }
};

navLogoutBtn.onclick = (e) => {
    e.preventDefault();
    signOut(auth).then(() => { alert("Logged out successfully!"); });
};

// === Like / Unlike ===
window.likeAnswer = async function(questionId, answerId, authorUid) {
    if (!auth.currentUser) { alert("Please login to vote."); return; }
    if (localStorage.getItem(`voted_${answerId}`)) { alert("You have already voted!"); return; }

    try {
        const answerRef = doc(db, "doubts", questionId, "answers", answerId);
        await updateDoc(answerRef, { likes: increment(1) });
        if (authorUid) {
            await updateDoc(doc(db, "users", authorUid), { totalLikes: increment(1) });
        }
        const countSpan = document.getElementById(`ans-like-count-${answerId}`);
        if(countSpan) countSpan.innerText = parseInt(countSpan.innerText) + 1;
        localStorage.setItem(`voted_${answerId}`, "true");
    } catch(error) { console.error("Error liking: ", error); }
};

window.unlikeAnswer = async function(questionId, answerId) {
    if (!auth.currentUser) { alert("Please login to vote."); return; }
    if (localStorage.getItem(`voted_${answerId}`)) { alert("You have already voted!"); return; }

    try {
        const answerRef = doc(db, "doubts", questionId, "answers", answerId);
        await updateDoc(answerRef, { unlikes: increment(1) });
        const countSpan = document.getElementById(`ans-unlike-count-${answerId}`);
        if(countSpan) countSpan.innerText = parseInt(countSpan.innerText) + 1;
        localStorage.setItem(`voted_${answerId}`, "true");
    } catch(error) { console.error("Error unliking: ", error); }
};

// === Submit Question ===
document.getElementById("ask-question-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const questionText = document.getElementById("question-text").value;
    if (containsBadWords(questionText)) { alert("Please use respectful language."); return; }
    const submitBtn = document.getElementById("submit-btn");
    submitBtn.innerText = "Posting..."; submitBtn.disabled = true;

    try {
        await addDoc(collection(db, "doubts"), {
            name: currentUserData.name,
            uid: auth.currentUser.uid,
            category: document.getElementById("question-category").value,
            question: questionText,
            imageUrl: document.getElementById("question-image").value,
            timestamp: serverTimestamp()
        });
        document.getElementById("ask-question-form").reset();
        qModal.style.display = "none";
        loadQuestions();
    } catch (error) { alert("Failed to post."); }
    submitBtn.innerText = "Post Question"; submitBtn.disabled = false;
});

// === Submit Answer ===
document.getElementById("submit-answer-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const answerText = document.getElementById("answer-text").value;
    if (containsBadWords(answerText)) { alert("Please use respectful language."); return; }
    const submitBtn = document.getElementById("submit-answer-btn");
    submitBtn.innerText = "Posting..."; submitBtn.disabled = true;
    const questionId = document.getElementById("answer-question-id").value;

    try {
        await addDoc(collection(db, "doubts", questionId, "answers"), {
            name: currentUserData.name,
            uid: auth.currentUser.uid,
            answer: answerText,
            imageUrl: document.getElementById("answer-image").value,
            likes: 0,
            unlikes: 0,
            timestamp: serverTimestamp()
        });
        document.getElementById("submit-answer-form").reset();
        aModal.style.display = "none";
        loadQuestions(); 
    } catch (error) { alert("Failed to post answer."); }
    submitBtn.innerText = "Post Answer"; submitBtn.disabled = false;
});

// === Fetch & Render Questions ===
async function loadQuestions(categoryFilter = "all") {
    questionsContainer.innerHTML = '<div class="loader">Loading questions...</div>';
    
    try {
        const q = query(collection(db, "doubts"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        questionsContainer.innerHTML = "";
        let count = 0;

        for (const documentSnapshot of querySnapshot.docs) {
            const data = documentSnapshot.data();
            const docId = documentSnapshot.id;
            
            if (categoryFilter === "all" || data.category === categoryFilter) {
                count++;
                let askerTick = "";
                if (data.uid) {
                    let askerData = await getUserData(data.uid);
                    if (askerData && (askerData.totalLikes || 0) >= 100) {
                        askerTick = '<i class="fas fa-check-circle blue-tick" title="Verified Achiever"></i>';
                    }
                }

                const ansQuery = query(collection(db, "doubts", docId, "answers"), orderBy("timestamp", "asc"));
                const ansSnapshot = await getDocs(ansQuery);
                let answersHTML = "";
                
                for (const ansDoc of ansSnapshot.docs) {
                    const ansData = ansDoc.data();
                    let ansDateStr = ansData.timestamp ? ansData.timestamp.toDate().toLocaleDateString() : "Just now";
                    let ansImgHTML = ansData.imageUrl ? `<img src="${ansData.imageUrl}" class="answer-img">` : "";
                    
                    let ansTick = "";
                    if (ansData.uid) {
                        let ansAuthorData = await getUserData(ansData.uid);
                        if (ansAuthorData && (ansAuthorData.totalLikes || 0) >= 100) {
                            ansTick = '<i class="fas fa-check-circle blue-tick" title="Verified Achiever"></i>';
                        }
                    }
                    
                    answersHTML += `
                        <div class="answer-item">
                            <div class="answer-header">
                                <span class="answer-author clickable-name" onclick="viewUserProfile('${ansData.uid || ''}')"><i class="fas fa-user"></i> &nbsp;${ansData.name} ${ansTick}</span>
                                <span class="answer-date">${ansDateStr}</span>
                            </div>
                            <div class="answer-body">${ansData.answer}</div>
                            ${ansImgHTML}
                            <div class="answer-actions">
                                <button class="action-btn like-btn" onclick="likeAnswer('${docId}', '${ansDoc.id}', '${ansData.uid || ''}')">
                                    <i class="fas fa-thumbs-up"></i> <span id="ans-like-count-${ansDoc.id}">${ansData.likes || 0}</span>
                                </button>
                                <button class="action-btn unlike-btn" onclick="unlikeAnswer('${docId}', '${ansDoc.id}')">
                                    <i class="fas fa-thumbs-down"></i> <span id="ans-unlike-count-${ansDoc.id}">${ansData.unlikes || 0}</span>
                                </button>
                            </div>
                        </div>
                    `;
                }

                const div = document.createElement("div");
                div.className = "question-card";
                let imgHTML = data.imageUrl ? `<img src="${data.imageUrl}" class="question-img">` : "";
                let dateStr = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : "Just now";

                div.innerHTML = `
                    <div class="question-header">
                        <span class="asker-info clickable-name" onclick="viewUserProfile('${data.uid || ''}')"><i class="fas fa-user-circle"></i> &nbsp;${data.name} ${askerTick}</span>
                        <span class="question-category">${data.category} • ${dateStr}</span>
                    </div>
                    <div class="question-body">${data.question}</div>
                    ${imgHTML}
                    <div class="card-actions">
                        <button class="action-btn reply-btn" onclick="openAnswerModal('${docId}')">
                            <i class="fas fa-reply"></i> Write Answer
                        </button>
                    </div>
                    <div class="answers-section">
                        <h4 class="answers-title">Answers (${ansSnapshot.size})</h4>
                        <div class="answers-list">${answersHTML}</div>
                    </div>
                `;
                questionsContainer.appendChild(div);
            }
        }
        if (count === 0) questionsContainer.innerHTML = '<div class="loader">No questions found.</div>';
    } catch (error) {
        console.error("Error: ", error);
        questionsContainer.innerHTML = '<div class="loader">Error loading questions.</div>';
    }
}

filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        loadQuestions(btn.getAttribute("data-filter"));
    });
});

loadQuestions();