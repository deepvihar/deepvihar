import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, query, orderBy, serverTimestamp, updateDoc, doc, increment, setDoc, limit, onSnapshot, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
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

const badWordsList = ["badword1", "badword2", "idiot", "stupid", "abuse", "fake", "pagal", "gali"]; 
function containsBadWords(text) {
    const lowerText = text.toLowerCase();
    return badWordsList.some(word => lowerText.includes(word));
}

function timeAgo(date) {
    if (!date) return "Just now";
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
}

function getBadgeHTML(coins) {
    if (coins >= 1000) return '<i class="fas fa-crown badge-icon" style="color: #e8b923;" title="Grandmaster (1000+ Coins)"></i>';
    if (coins >= 500) return '<i class="fas fa-medal badge-icon" style="color: #ffd700;" title="Expert (500+ Coins)"></i>';
    if (coins >= 100) return '<i class="fas fa-medal badge-icon" style="color: #c0c0c0;" title="Scholar (100+ Coins)"></i>';
    if (coins >= 50) return '<i class="fas fa-medal badge-icon" style="color: #cd7f32;" title="Rising Star (50+ Coins)"></i>';
    return '';
}

const navLoginBtn = document.getElementById("nav-login-btn");
const navProfileBtn = document.getElementById("nav-profile-btn");
const navLogoutBtn = document.getElementById("nav-logout-btn");
const navInboxBtn = document.getElementById("nav-inbox-btn");

const authModal = document.getElementById("auth-modal");
const profileModal = document.getElementById("profile-modal");
const publicProfileModal = document.getElementById("public-profile-modal");
const qModal = document.getElementById("question-modal");
const aModal = document.getElementById("answer-modal");
const inboxModal = document.getElementById("inbox-modal");
const chatModal = document.getElementById("chat-modal");

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
let currentDocs = [];
let displayIndex = 0;
const RENDER_BATCH = 5;
let currentChatId = null;
let currentChatTargetName = null;
let chatUnsubscribe = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        navLoginBtn.style.display = "none";
        navProfileBtn.style.display = "inline-block";
        navInboxBtn.style.display = "inline-block";
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
        navInboxBtn.style.display = "none";
        navLogoutBtn.style.display = "none";
    }
});

function updateProfileUI() {
    if (!currentUserData) return;
    document.getElementById("profile-name").innerText = currentUserData.name;
    document.getElementById("profile-email").innerText = currentUserData.email;
    document.getElementById("profile-likes-count").innerText = currentUserData.totalLikes || 0;
    document.getElementById("profile-coins-count").innerText = currentUserData.dvCoins || 0;
    document.getElementById("profile-bio").innerText = currentUserData.bio || "No bio added yet.";
    
    const avatarContainer = document.getElementById("profile-avatar-container");
    if (currentUserData.photoURL) {
        avatarContainer.innerHTML = `<img src="${currentUserData.photoURL}" class="profile-avatar-img">`;
    } else {
        avatarContainer.innerHTML = `<i class="fas fa-user-graduate"></i>`;
    }
    document.getElementById("profile-badge").innerHTML = getBadgeHTML(currentUserData.dvCoins || 0);
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

window.viewUserProfile = async function(uid) {
    if (!uid || uid === "undefined") { alert("User profile not available."); return; }
    
    document.getElementById("public-profile-name").innerText = "Loading...";
    document.getElementById("public-profile-badge").innerHTML = "";
    document.getElementById("public-profile-likes-count").innerText = "0";
    document.getElementById("public-profile-coins-count").innerText = "0";
    document.getElementById("public-profile-bio").innerText = "";
    document.getElementById("public-profile-avatar-container").innerHTML = `<i class="fas fa-user"></i>`;
    
    const msgBtn = document.getElementById("public-msg-btn");
    msgBtn.style.display = "none";
    
    publicProfileModal.style.display = "block";

    try {
        let uData = await getUserData(uid);
        if (uData) {
            document.getElementById("public-profile-name").innerText = uData.name;
            document.getElementById("public-profile-likes-count").innerText = uData.totalLikes || 0;
            document.getElementById("public-profile-coins-count").innerText = uData.dvCoins || 0;
            document.getElementById("public-profile-bio").innerText = uData.bio || "";
            
            if (uData.photoURL) {
                document.getElementById("public-profile-avatar-container").innerHTML = `<img src="${uData.photoURL}" class="profile-avatar-img">`;
            }
            document.getElementById("public-profile-badge").innerHTML = getBadgeHTML(uData.dvCoins || 0);
            
            if (auth.currentUser && auth.currentUser.uid !== uid) {
                msgBtn.style.display = "block";
                msgBtn.onclick = () => {
                    publicProfileModal.style.display = "none";
                    openChatModal(uid, uData.name);
                };
            }
        } else {
            document.getElementById("public-profile-name").innerText = "Unknown User";
        }
    } catch (e) {
        document.getElementById("public-profile-name").innerText = "Error loading";
    }
};

function getChatId(uid1, uid2) {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

async function loadInbox() {
    const inboxList = document.getElementById("inbox-list");
    inboxList.innerHTML = '<div class="loader">Loading chats...</div>';
    
    if (!auth.currentUser) return;
    
    try {
        const q = query(collection(db, "chats"), where("users", "array-contains", auth.currentUser.uid));
        const snap = await getDocs(q);
        
        let chats = [];
        snap.forEach(doc => {
            let data = doc.data();
            data.id = doc.id;
            chats.push(data);
        });
        
        chats.sort((a, b) => {
            let timeA = a.lastMessageTime ? a.lastMessageTime.toMillis() : 0;
            let timeB = b.lastMessageTime ? b.lastMessageTime.toMillis() : 0;
            return timeB - timeA;
        });

        let html = "";
        for (let chat of chats) {
            let otherUid = chat.users.find(id => id !== auth.currentUser.uid);
            let otherName = chat.userNames[otherUid] || "Unknown User";
            
            let timeStr = chat.lastMessageTime ? timeAgo(chat.lastMessageTime.toDate()) : "";
            
            html += `
                <div class="inbox-item" onclick="openChatModal('${otherUid}', '${otherName}')">
                    <i class="fas fa-user-circle" style="font-size: 35px; color: var(--text-light);"></i>
                    <div class="inbox-item-info">
                        <div style="display:flex; justify-content:space-between;">
                            <div class="inbox-name">${otherName}</div>
                            <div style="font-size:10px; color:var(--text-light);">${timeStr}</div>
                        </div>
                        <div class="inbox-last-msg">${chat.lastMessage || 'New Chat'}</div>
                    </div>
                </div>
            `;
        }
        
        if (html === "") html = "<p style='text-align:center; font-size:13px; color:var(--text-light);'>No messages yet. Open someone's profile to start chatting!</p>";
        inboxList.innerHTML = html;
        
    } catch(e) {
        inboxList.innerHTML = "<p>Error loading messages.</p>";
    }
}

window.openChatModal = function(targetUid, targetName) {
    if (!auth.currentUser) { alert("Please login to message."); return; }
    
    inboxModal.style.display = "none";
    chatModal.style.display = "block";
    document.getElementById("chat-user-name").innerText = targetName;
    document.getElementById("chat-body").innerHTML = "";
    
    currentChatId = getChatId(auth.currentUser.uid, targetUid);
    currentChatTargetName = targetName;
    
    if (chatUnsubscribe) { chatUnsubscribe(); }
    
    const messagesRef = collection(db, "chats", currentChatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    
    chatUnsubscribe = onSnapshot(q, (snapshot) => {
        let html = "";
        snapshot.forEach((docSnap) => {
            let msg = docSnap.data();
            let isMe = msg.sender === auth.currentUser.uid;
            html += `<div class="msg-bubble ${isMe ? 'msg-sent' : 'msg-received'}">${msg.text}</div>`;
        });
        const chatBody = document.getElementById("chat-body");
        chatBody.innerHTML = html;
        chatBody.scrollTop = chatBody.scrollHeight;
    });
};

document.getElementById("chat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentChatId || !auth.currentUser) return;
    
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    
    try {
        const myUid = auth.currentUser.uid;
        const myName = currentUserData.name;
        const targetUid = currentChatId.replace(myUid, "").replace("_", "");
        
        await addDoc(collection(db, "chats", currentChatId, "messages"), {
            sender: myUid,
            text: text,
            timestamp: serverTimestamp()
        });
        
        await setDoc(doc(db, "chats", currentChatId), {
            users: [myUid, targetUid],
            userNames: {
                [myUid]: myName,
                [targetUid]: currentChatTargetName
            },
            lastMessage: text,
            lastMessageTime: serverTimestamp()
        }, { merge: true });
        
    } catch(e) { console.error("Error sending msg", e); }
});

navLoginBtn.onclick = (e) => { e.preventDefault(); authModal.style.display = "block"; };
navProfileBtn.onclick = (e) => { e.preventDefault(); profileModal.style.display = "block"; };
navInboxBtn.onclick = (e) => { e.preventDefault(); inboxModal.style.display = "block"; loadInbox(); };

document.getElementById("close-auth-modal").onclick = () => authModal.style.display = "none";
document.getElementById("close-profile-modal").onclick = () => profileModal.style.display = "none";
document.getElementById("close-public-profile-modal").onclick = () => publicProfileModal.style.display = "none";
document.getElementById("close-q-modal").onclick = () => qModal.style.display = "none";
document.getElementById("close-a-modal").onclick = () => aModal.style.display = "none";
document.getElementById("close-inbox-modal").onclick = () => inboxModal.style.display = "none";
document.getElementById("close-chat-modal").onclick = () => { chatModal.style.display = "none"; if(chatUnsubscribe) chatUnsubscribe(); };

window.onclick = (e) => { 
    if (e.target == qModal) qModal.style.display = "none"; 
    if (e.target == aModal) aModal.style.display = "none";
    if (e.target == authModal) authModal.style.display = "none";
    if (e.target == profileModal) profileModal.style.display = "none";
    if (e.target == publicProfileModal) publicProfileModal.style.display = "none";
    if (e.target == inboxModal) inboxModal.style.display = "none";
    if (e.target == chatModal) { chatModal.style.display = "none"; if(chatUnsubscribe) chatUnsubscribe(); }
};

openQModalBtn.onclick = () => {
    if (!auth.currentUser) { alert("Please Login first to ask a question."); authModal.style.display = "block"; } 
    else { qModal.style.display = "block"; }
};

window.openAnswerModal = function(questionId) {
    if (!auth.currentUser) { alert("Please Login first to write an answer."); authModal.style.display = "block"; } 
    else { document.getElementById("answer-question-id").value = questionId; aModal.style.display = "block"; }
};

const editProfileBtn = document.getElementById("edit-profile-btn");
const editProfileForm = document.getElementById("edit-profile-form");
const saveProfileBtn = document.getElementById("save-profile-btn");

if (editProfileBtn) {
    editProfileBtn.onclick = () => {
        editProfileForm.style.display = editProfileForm.style.display === "none" ? "block" : "none";
        document.getElementById("edit-photo-url").value = currentUserData.photoURL || "";
        document.getElementById("edit-bio").value = currentUserData.bio || "";
    };
}

if (saveProfileBtn) {
    saveProfileBtn.onclick = async () => {
        const newPhoto = document.getElementById("edit-photo-url").value;
        const newBio = document.getElementById("edit-bio").value;
        saveProfileBtn.innerText = "Saving...";
        try {
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
                photoURL: newPhoto,
                bio: newBio
            });
            currentUserData.photoURL = newPhoto;
            currentUserData.bio = newBio;
            usersCache[auth.currentUser.uid] = currentUserData;
            updateProfileUI();
            editProfileForm.style.display = "none";
            loadQuestions(); 
            loadLeaderboard();
        } catch(e) {
            alert("Error saving profile");
        }
        saveProfileBtn.innerText = "Save";
    };
}

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
                dvCoins: 0,
                uid: userCred.user.uid,
                photoURL: "",
                bio: ""
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
        loadLeaderboard();
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
        
        await updateDoc(doc(db, "users", auth.currentUser.uid), { dvCoins: increment(2) });
        if (currentUserData) currentUserData.dvCoins = (currentUserData.dvCoins || 0) + 2;
        
        document.getElementById("ask-question-form").reset();
        qModal.style.display = "none";
        updateProfileUI();
        loadQuestions();
    } catch (error) { alert("Failed to post."); }
    submitBtn.innerText = "Post Question"; submitBtn.disabled = false;
});

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
        
        await updateDoc(doc(db, "users", auth.currentUser.uid), { dvCoins: increment(5) });
        if (currentUserData) currentUserData.dvCoins = (currentUserData.dvCoins || 0) + 5;
        
        document.getElementById("submit-answer-form").reset();
        aModal.style.display = "none";
        updateProfileUI();
        loadQuestions(); 
    } catch (error) { alert("Failed to post answer."); }
    submitBtn.innerText = "Post Answer"; submitBtn.disabled = false;
});

async function loadLeaderboard() {
    try {
        const lbContainer = document.getElementById("leaderboard-list");
        const q = query(collection(db, "users"), orderBy("totalLikes", "desc"), limit(10));
        const snap = await getDocs(q);
        
        let html = "";
        let rank = 1;
        
        snap.forEach(docSnap => {
            const u = docSnap.data();
            if ((u.totalLikes || 0) > 0) {
                let badge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                let avatar = u.photoURL ? `<img src="${u.photoURL}" class="lb-avatar">` : `<i class="fas fa-user-circle lb-avatar-icon"></i>`;
                
                html += `
                    <div class="lb-item" onclick="viewUserProfile('${u.uid}')">
                        <div class="lb-rank" style="color: ${rank <= 3 ? '#ecc94b' : 'var(--text-light)'};">${badge}</div>
                        ${avatar}
                        <div class="lb-info">
                            <div class="lb-name">${u.name} <span class="lb-badge">${getBadgeHTML(u.dvCoins || 0)}</span></div>
                            <div class="lb-likes">${u.totalLikes} Likes</div>
                        </div>
                    </div>
                `;
                rank++;
            }
        });
        
        if (html === "") html = "<p style='font-size:12px; color:var(--text-light); text-align:center; width:100%;'>No ranked users yet.</p>";
        lbContainer.innerHTML = html;
        
    } catch (error) {
        console.error("Error loading leaderboard", error);
    }
}

async function renderNextBatch() {
    if (displayIndex >= currentDocs.length) return;
    
    const batch = currentDocs.slice(displayIndex, displayIndex + RENDER_BATCH);
    
    for (const documentSnapshot of batch) {
        const data = documentSnapshot.data();
        const docId = documentSnapshot.id;
        
        let askerTick = "";
        let askerAvatar = `<i class="fas fa-user-circle"></i>`;
        
        if (data.uid) {
            let askerData = await getUserData(data.uid);
            if (askerData) {
                askerTick = getBadgeHTML(askerData.dvCoins || 0);
                if (askerData.photoURL) askerAvatar = `<img src="${askerData.photoURL}" class="mini-avatar">`;
            }
        }

        const ansQuery = query(collection(db, "doubts", docId, "answers"), orderBy("timestamp", "asc"));
        const ansSnapshot = await getDocs(ansQuery);
        let answersHTML = "";
        
        let trendingHTML = "";
        if (ansSnapshot.size >= 2) {
            trendingHTML = `<span class="trending-badge"><i class="fas fa-fire"></i> Trending</span>`;
        }
        
        for (const ansDoc of ansSnapshot.docs) {
            const ansData = ansDoc.data();
            let ansDateStr = ansData.timestamp ? timeAgo(ansData.timestamp.toDate()) : "Just now";
            let ansImgHTML = ansData.imageUrl ? `<img src="${ansData.imageUrl}" class="answer-img">` : "";
            
            let ansTick = "";
            let ansAvatar = `<i class="fas fa-user"></i> &nbsp;`;
            
            if (ansData.uid) {
                let ansAuthorData = await getUserData(ansData.uid);
                if (ansAuthorData) {
                    ansTick = getBadgeHTML(ansAuthorData.dvCoins || 0);
                    if (ansAuthorData.photoURL) ansAvatar = `<img src="${ansAuthorData.photoURL}" class="mini-avatar">`;
                }
            }
            
            answersHTML += `
                <div class="answer-item">
                    <div class="answer-header">
                        <span class="answer-author clickable-name" onclick="viewUserProfile('${ansData.uid || ''}')">${ansAvatar}${ansData.name} ${ansTick}</span>
                        <span class="answer-date" style="font-size: 11px; opacity: 0.7;">${ansDateStr}</span>
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
        let dateStr = data.timestamp ? timeAgo(data.timestamp.toDate()) : "Just now";

        div.innerHTML = `
            <div class="question-header">
                <span class="asker-info clickable-name" onclick="viewUserProfile('${data.uid || ''}')">${askerAvatar}&nbsp;${data.name} ${askerTick}</span>
                <div style="display:flex; align-items:center;">
                    <span class="question-category" style="margin-right: 5px;">${data.category} • ${dateStr}</span>
                    ${trendingHTML}
                </div>
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
    
    displayIndex += RENDER_BATCH;
}

async function loadQuestions(categoryFilter = "all") {
    questionsContainer.innerHTML = '<div class="loader">Loading questions...</div>';
    
    try {
        const q = query(collection(db, "doubts"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        currentDocs = querySnapshot.docs.filter(docSnap => {
            const data = docSnap.data();
            return categoryFilter === "all" || data.category === categoryFilter;
        });
        
        displayIndex = 0;
        questionsContainer.innerHTML = "";
        
        if (currentDocs.length === 0) {
            questionsContainer.innerHTML = '<div class="loader">No questions found.</div>';
            return;
        }
        
        await renderNextBatch();
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

const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        if (displayIndex < currentDocs.length) {
            document.getElementById("load-more-spinner").style.display = "inline-block";
            renderNextBatch().then(() => {
                document.getElementById("load-more-spinner").style.display = "none";
            });
        }
    }
}, { rootMargin: "100px" });

setTimeout(() => {
    const trigger = document.getElementById("load-more-trigger");
    if(trigger) observer.observe(trigger);
}, 1000);

loadLeaderboard();
loadQuestions();