const STORAGE_KEY = "pourlog-mvp-state";

const defaultState = {
  currentUser: null,
  posts: [
    {
      id: crypto.randomUUID(),
      author: "소믈리에 지망생",
      wineName: "Chateau Musar 2016",
      place: "연남동 작은 바",
      story:
        "말린 체리와 향신료가 길게 남았고 양갈비랑 너무 잘 맞았어요. 다음에는 1시간 더 열어두고 마셔보고 싶습니다.",
      photo: "",
      createdAt: new Date(Date.now() - 1000 * 60 * 46).toISOString(),
      comments: [{ author: "민지", text: "이 와인 궁금했는데 저장해둘게요." }],
    },
    {
      id: crypto.randomUUID(),
      author: "와인초보",
      wineName: "Riesling Kabinett",
      place: "집들이",
      story:
        "매운 떡볶이랑 같이 마셨는데 산미랑 단맛이 균형을 잡아줘서 분위기가 확 살았어요.",
      photo: "",
      createdAt: new Date(Date.now() - 1000 * 60 * 170).toISOString(),
      comments: [],
    },
  ],
  meetups: [
    {
      id: crypto.randomUUID(),
      host: "혜진",
      title: "피노 누아 4종 비교 테이스팅",
      date: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
      place: "한남동 테이스팅 룸",
      capacity: 8,
      joined: 3,
      deposit: 45000,
      account: "카카오뱅크 3333-12-9876543",
      holder: "박혜진",
      description: "부르고뉴, 오리건, 뉴질랜드, 독일 피노를 한 잔씩 비교합니다.",
    },
  ],
};

let state = loadState();

const views = {
  feed: document.querySelector("#feedView"),
  meetups: document.querySelector("#meetupsView"),
  profile: document.querySelector("#profileView"),
};

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.querySelector("#loginButton").addEventListener("click", () => {
  if (state.currentUser) {
    state.currentUser = null;
  } else {
    state.currentUser = {
      name: "카카오 와인러",
      avatar: "KW",
    };
  }
  persist();
  render();
});

document.querySelector("#postForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  ensureLoggedIn();

  const form = event.currentTarget;
  const photoFile = document.querySelector("#photo").files[0];
  const photo = photoFile ? await fileToDataUrl(photoFile) : "";

  state.posts.unshift({
    id: crypto.randomUUID(),
    author: state.currentUser.name,
    wineName: form.wineName.value.trim(),
    place: form.place.value.trim(),
    story: form.story.value.trim(),
    photo,
    createdAt: new Date().toISOString(),
    comments: [],
  });

  form.reset();
  persist();
  render();
});

document.querySelector("#meetupForm").addEventListener("submit", (event) => {
  event.preventDefault();
  ensureLoggedIn();

  state.meetups.unshift({
    id: crypto.randomUUID(),
    host: state.currentUser.name,
    title: document.querySelector("#meetupTitle").value.trim(),
    date: new Date(document.querySelector("#meetupDate").value).toISOString(),
    place: document.querySelector("#meetupPlace").value.trim(),
    capacity: Number(document.querySelector("#capacity").value),
    joined: 0,
    deposit: Number(document.querySelector("#deposit").value),
    account: document.querySelector("#account").value.trim(),
    holder: document.querySelector("#holder").value.trim(),
    description: document.querySelector("#meetupDescription").value.trim(),
  });

  event.currentTarget.reset();
  persist();
  render();
});

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : defaultState;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureLoggedIn() {
  if (!state.currentUser) {
    state.currentUser = { name: "카카오 와인러", avatar: "KW" };
  }
}

function setView(viewName) {
  Object.entries(views).forEach(([name, view]) => {
    view.classList.toggle("active-view", name === viewName);
  });
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
}

function render() {
  renderAuth();
  renderStats();
  renderPosts();
  renderMeetups();
  renderProfile();
}

function renderAuth() {
  const loginButton = document.querySelector("#loginButton");
  const badge = document.querySelector("#activeUserBadge");

  if (state.currentUser) {
    loginButton.textContent = "로그아웃";
    badge.textContent = `${state.currentUser.name}님 작성 가능`;
    return;
  }

  loginButton.textContent = "카카오 로그인";
  badge.textContent = "로그인이 필요합니다";
}

function renderStats() {
  const commentCount = state.posts.reduce((total, post) => total + post.comments.length, 0);
  document.querySelector("#statPosts").textContent = state.posts.length;
  document.querySelector("#statMeetups").textContent = state.meetups.length;
  document.querySelector("#statComments").textContent = commentCount;
}

function renderPosts() {
  const list = document.querySelector("#postList");
  list.innerHTML = "";

  if (!state.posts.length) {
    list.innerHTML = `<div class="empty-state">첫 와인 기록을 올려보세요.</div>`;
    return;
  }

  state.posts.forEach((post) => {
    const template = document.querySelector("#postTemplate").content.cloneNode(true);
    const card = template.querySelector(".post-card");
    const photoFrame = template.querySelector(".photo-frame");

    if (post.photo) {
      photoFrame.style.backgroundImage = `url(${post.photo})`;
    }

    template.querySelector(".author").textContent = post.author;
    template.querySelector("time").textContent = relativeTime(post.createdAt);
    template.querySelector("h3").textContent = post.wineName;
    template.querySelector(".place").textContent = post.place;
    template.querySelector(".story").textContent = post.story;
    template.querySelector(".comments").innerHTML = post.comments.length
      ? post.comments
          .map((comment) => `<span><strong>${escapeHtml(comment.author)}</strong> ${escapeHtml(comment.text)}</span>`)
          .join("")
      : "<span>아직 댓글이 없습니다.</span>";

    template.querySelector(".comment-form").addEventListener("submit", (event) => {
      event.preventDefault();
      ensureLoggedIn();
      const input = event.currentTarget.querySelector("input");
      post.comments.push({
        author: state.currentUser.name,
        text: input.value.trim(),
      });
      input.value = "";
      persist();
      render();
    });

    list.append(card);
  });
}

function renderMeetups() {
  const list = document.querySelector("#meetupList");
  list.innerHTML = "";

  if (!state.meetups.length) {
    list.innerHTML = `<div class="empty-state">첫 와인 모임을 만들어보세요.</div>`;
    return;
  }

  state.meetups.forEach((meetup) => {
    const template = document.querySelector("#meetupTemplate").content.cloneNode(true);
    const card = template.querySelector(".meetup-card");
    const remaining = Math.max(meetup.capacity - meetup.joined, 0);

    template.querySelector(".host").textContent = `호스트 ${meetup.host}`;
    template.querySelector("time").textContent = formatDate(meetup.date);
    template.querySelector("h3").textContent = meetup.title;
    template.querySelector(".meetup-description").textContent = meetup.description;
    template.querySelector(".meetup-details").innerHTML = `
      <span>장소 ${escapeHtml(meetup.place)}</span>
      <span>정원 ${meetup.joined}/${meetup.capacity}명</span>
      <span>남은 자리 ${remaining}명</span>
    `;
    template.querySelector(".deposit").textContent = `${meetup.deposit.toLocaleString()}원 선입금`;
    template.querySelector(".account").textContent = `${meetup.account} / ${meetup.holder}`;

    const joinButton = template.querySelector(".join-button");
    joinButton.disabled = remaining === 0;
    joinButton.textContent = remaining === 0 ? "모집 완료" : "참가 신청";
    joinButton.addEventListener("click", () => {
      ensureLoggedIn();
      if (meetup.joined < meetup.capacity) {
        meetup.joined += 1;
        persist();
        render();
      }
    });

    list.append(card);
  });
}

function renderProfile() {
  const userName = state.currentUser?.name ?? "게스트";
  const myPosts = state.posts.filter((post) => post.author === userName).length;
  const myMeetups = state.meetups.filter((meetup) => meetup.host === userName).length;

  document.querySelector("#profileName").textContent = userName;
  document.querySelector("#profileDescription").textContent = state.currentUser
    ? "카카오 계정 기반 커뮤니티 활동이 연결된 상태입니다."
    : "카카오 로그인 후 댓글과 모집글 작성자를 확인할 수 있습니다.";
  document.querySelector("#myPostCount").textContent = `${myPosts}개`;
  document.querySelector("#myMeetupCount").textContent = `${myMeetups}개`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function relativeTime(dateString) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(dateString).getTime()) / 60000));
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.round(hours / 24)}일 전`;
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}

render();
