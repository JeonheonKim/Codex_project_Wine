const STORAGE_KEY = "wine-together-state-v2";

const imageGradients = [
  "linear-gradient(135deg, #7f1533, #d49a68)",
  "linear-gradient(135deg, #294f43, #d6b26f)",
  "linear-gradient(135deg, #4e0b20, #9e4660)",
  "linear-gradient(135deg, #1f2f35, #bd9a5f)",
];

const defaultState = {
  currentUser: null,
  users: [
    { id: "u-admin", name: "Admin Kim", role: "admin", avatar: "AK" },
    { id: "u-user", name: "카카오 와인러", role: "user", avatar: "KW" },
  ],
  adminRequests: [
    {
      id: crypto.randomUUID(),
      userId: "u-user",
      userName: "카카오 와인러",
      reason: "성수 지역 와인 모임을 월 1회 운영하고 싶습니다.",
      status: "pending",
    },
  ],
  gallery: [
    {
      id: crypto.randomUUID(),
      author: "소믈리에 지망생",
      wineName: "Chateau Musar 2016",
      story: "말린 체리와 향신료가 길게 남았던 저녁.",
      photo: "",
      gradientIndex: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 46).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      author: "와인초보",
      wineName: "Riesling Kabinett",
      story: "매운 음식과 산미, 단맛의 균형이 좋았어요.",
      photo: "",
      gradientIndex: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 170).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      author: "민지",
      wineName: "Etna Rosso",
      story: "화산토 느낌의 미네랄과 붉은 과실감.",
      photo: "",
      gradientIndex: 2,
      createdAt: new Date(Date.now() - 1000 * 60 * 260).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      author: "혜진",
      wineName: "Grower Champagne",
      story: "작은 축하 자리에 딱 맞는 산뜻한 버블.",
      photo: "",
      gradientIndex: 3,
      createdAt: new Date(Date.now() - 1000 * 60 * 380).toISOString(),
    },
  ],
  meetups: [
    {
      id: "seed-pinot",
      host: "Admin Kim",
      title: "피노 누아 4종 비교 테이스팅",
      date: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
      place: "한남동 테이스팅 룸",
      capacity: 8,
      joined: 3,
      deposit: 45000,
      account: "카카오뱅크 3333-12-9876543",
      description: "부르고뉴, 오리건, 뉴질랜드, 독일 피노를 한 잔씩 비교합니다.",
    },
    {
      id: "seed-natural",
      host: "Admin Kim",
      title: "내추럴 와인 입문 모임",
      date: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString(),
      place: "성수 프라이빗 바",
      capacity: 10,
      joined: 6,
      deposit: 35000,
      account: "토스뱅크 1000-22-778899",
      description: "가볍게 시작하는 내추럴 와인 3종과 치즈 페어링.",
    },
  ],
  meetupApplications: [
    {
      id: crypto.randomUUID(),
      meetupId: "seed-pinot",
      userId: "u-user",
      userName: "카카오 와인러",
      status: "pending",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ],
};

const banners = [
  {
    title: "5월 와인 페어 사전 예약",
    copy: "인기 수입사 테이스팅 패키지를 WINE TOGETHER 회원가로 만나보세요.",
    bg: "linear-gradient(135deg, #591022, #b56a42)",
  },
  {
    title: "성수 신규 와인바 오픈",
    copy: "첫 방문 멤버에게 웰컴 스파클링 한 잔을 제공합니다.",
    bg: "linear-gradient(135deg, #173f34, #b58b43)",
  },
  {
    title: "초보자를 위한 와인 클래스",
    copy: "품종, 산지, 페어링을 한 번에 배우는 주말 클래스.",
    bg: "linear-gradient(135deg, #2d2831, #8b1238)",
  },
];

let state = normalizeState(loadState());
let bannerIndex = 0;

const authButton = document.querySelector("#authButton");
const userPanel = document.querySelector("#userPanel");
const postDialog = document.querySelector("#postDialog");

document.querySelector("#prevBanner").addEventListener("click", () => moveBanner(-1));
document.querySelector("#nextBanner").addEventListener("click", () => moveBanner(1));
document.querySelector("#openPostComposer").addEventListener("click", openPostComposer);
authButton.addEventListener("click", openUserPanel);
document.querySelector("#closePanel").addEventListener("click", closeUserPanel);
document.querySelector("#loginAction").addEventListener("click", login);
document.querySelector("#adminLoginAction").addEventListener("click", loginAdmin);
document.querySelector("#logoutAction").addEventListener("click", logout);

document.querySelectorAll(".panel-tab").forEach((button) => {
  button.addEventListener("click", () => setPanelTab(button.dataset.panelTab));
});

document.querySelector("#adminRequestForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) return login();
  const existing = state.adminRequests.find((request) => request.userId === user.id && request.status === "pending");
  if (!existing) {
    state.adminRequests.push({
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      reason: document.querySelector("#adminReason").value.trim(),
      status: "pending",
    });
  }
  event.currentTarget.reset();
  persist();
  render();
});

document.querySelector("#meetupForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const user = getCurrentUser();
  if (!isAdmin(user)) return;
  state.meetups.unshift({
    id: crypto.randomUUID(),
    host: user.name,
    title: document.querySelector("#meetupTitle").value.trim(),
    date: new Date(document.querySelector("#meetupDate").value).toISOString(),
    place: document.querySelector("#meetupPlace").value.trim(),
    capacity: Number(document.querySelector("#capacity").value),
    joined: 0,
    deposit: Number(document.querySelector("#deposit").value),
    account: document.querySelector("#account").value.trim(),
    description: document.querySelector("#meetupDescription").value.trim(),
  });
  event.currentTarget.reset();
  persist();
  render();
});

document.querySelector("#postForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) return login();
  const photoFile = document.querySelector("#photo").files[0];
  const photo = photoFile ? await fileToDataUrl(photoFile) : "";
  state.gallery.unshift({
    id: crypto.randomUUID(),
    author: user.name,
    wineName: document.querySelector("#wineName").value.trim(),
    story: document.querySelector("#story").value.trim(),
    photo,
    gradientIndex: state.gallery.length % imageGradients.length,
    createdAt: new Date().toISOString(),
  });
  event.currentTarget.reset();
  postDialog.close();
  persist();
  render();
});

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : defaultState;
}

function normalizeState(savedState) {
  return {
    ...defaultState,
    ...savedState,
    users: savedState.users ?? defaultState.users,
    adminRequests: savedState.adminRequests ?? defaultState.adminRequests,
    gallery: savedState.gallery ?? savedState.posts ?? defaultState.gallery,
    meetups: savedState.meetups ?? defaultState.meetups,
    meetupApplications: savedState.meetupApplications ?? defaultState.meetupApplications,
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCurrentUser() {
  return state.currentUser ? state.users.find((user) => user.id === state.currentUser.id) : null;
}

function isAdmin(user) {
  return user?.role === "admin";
}

function login() {
  state.currentUser = { id: "u-user" };
  persist();
  render();
}

function loginAdmin() {
  state.currentUser = { id: "u-admin" };
  persist();
  render();
}

function logout() {
  state.currentUser = null;
  persist();
  render();
}

function openUserPanel() {
  userPanel.classList.add("open");
  userPanel.setAttribute("aria-hidden", "false");
  renderUserPanel();
}

function closeUserPanel() {
  userPanel.classList.remove("open");
  userPanel.setAttribute("aria-hidden", "true");
}

function openPostComposer() {
  if (!getCurrentUser()) {
    openUserPanel();
    return;
  }
  postDialog.showModal();
}

function setPanelTab(tabName) {
  document.querySelectorAll(".panel-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.panelTab === tabName);
  });
  document.querySelector("#userTab").classList.toggle("active-panel", tabName === "user");
  document.querySelector("#adminTab").classList.toggle("active-panel", tabName === "admin");
}

function moveBanner(direction) {
  bannerIndex = (bannerIndex + direction + banners.length) % banners.length;
  renderBanners();
}

function render() {
  renderBanners();
  renderAuth();
  renderGallery();
  renderMeetups();
  renderUserPanel();
}

function renderBanners() {
  const track = document.querySelector("#bannerTrack");
  track.innerHTML = banners
    .map(
      (banner) => `
        <article class="banner-card" style="--banner-bg: ${banner.bg}">
          <h3>${escapeHtml(banner.title)}</h3>
          <p>${escapeHtml(banner.copy)}</p>
        </article>
      `,
    )
    .join("");
  track.style.transform = `translateX(calc(${bannerIndex} * (min(75vw, 44rem) + 1rem) * -1))`;
}

function renderAuth() {
  const user = getCurrentUser();
  authButton.textContent = user ? "USER INFO" : "LOGIN";
  authButton.classList.toggle("user-icon", Boolean(user));
}

function renderGallery() {
  const grid = document.querySelector("#galleryGrid");
  if (!state.gallery.length) {
    grid.innerHTML = `<div class="empty-state">첫 와인 사진을 올려보세요.</div>`;
    return;
  }
  grid.innerHTML = state.gallery
    .map((post) => {
      const photoStyle = post.photo
        ? `background-image: url(${post.photo})`
        : `--photo-bg: ${imageGradients[post.gradientIndex ?? 0]}`;
      return `
        <article class="gallery-card">
          <div class="gallery-photo" style="${photoStyle}"></div>
          <div class="gallery-body">
            <div class="gallery-meta">
              <span>${escapeHtml(post.author)}</span>
              <span>${relativeTime(post.createdAt)}</span>
            </div>
            <h3>${escapeHtml(post.wineName)}</h3>
            <p>${escapeHtml(post.story)}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMeetups() {
  const list = document.querySelector("#meetupList");
  const user = getCurrentUser();
  document.querySelector("#meetupHint").textContent = isAdmin(user)
    ? "USER INFO > ADMIN에서 모임 등록 가능"
    : "Admin 승인 유저만 모임 등록 가능";

  list.innerHTML = state.meetups
    .map((meetup) => {
      const confirmedCount = getConfirmedCount(meetup.id, meetup.joined);
      const pendingCount = getPendingCount(meetup.id);
      const remaining = Math.max(meetup.capacity - confirmedCount, 0);
      const userApplication = user
        ? state.meetupApplications.find((item) => item.meetupId === meetup.id && item.userId === user.id)
        : null;
      const buttonText = getJoinButtonText(remaining, userApplication);
      const disabled = remaining === 0 || Boolean(userApplication);
      return `
        <article class="meetup-card">
          <div>
            <div class="meetup-meta">
              <span>HOST ${escapeHtml(meetup.host)}</span>
              <span>${formatDate(meetup.date)}</span>
            </div>
            <h3>${escapeHtml(meetup.title)}</h3>
            <p>${escapeHtml(meetup.description)}</p>
          </div>
          <div class="meetup-detail">
            <span>장소 ${escapeHtml(meetup.place)}</span>
            <span>확정 ${confirmedCount}/${meetup.capacity}명</span>
            <span>입금 확인 대기 ${pendingCount}명</span>
            <span>남은 자리 ${remaining}명</span>
          </div>
          <div class="join-box">
            <strong>${meetup.deposit.toLocaleString()}원</strong>
            <span>${escapeHtml(meetup.account)}</span>
            <button class="join-button" type="button" data-join-id="${meetup.id}" ${disabled ? "disabled" : ""}>
              ${buttonText}
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-join-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const currentUser = getCurrentUser();
      if (!currentUser) return openUserPanel();
      const meetup = state.meetups.find((item) => item.id === button.dataset.joinId);
      const confirmedCount = meetup ? getConfirmedCount(meetup.id, meetup.joined) : 0;
      const alreadyApplied = state.meetupApplications.some(
        (item) => item.meetupId === meetup?.id && item.userId === currentUser.id,
      );
      if (meetup && confirmedCount < meetup.capacity && !alreadyApplied) {
        state.meetupApplications.push({
          id: crypto.randomUUID(),
          meetupId: meetup.id,
          userId: currentUser.id,
          userName: currentUser.name,
          status: "pending",
          createdAt: new Date().toISOString(),
        });
        persist();
        render();
      }
    });
  });
}

function getConfirmedCount(meetupId, fallbackJoined = 0) {
  const confirmed = state.meetupApplications.filter(
    (application) => application.meetupId === meetupId && application.status === "confirmed",
  ).length;
  return Math.max(confirmed, fallbackJoined ?? 0);
}

function getPendingCount(meetupId) {
  return state.meetupApplications.filter(
    (application) => application.meetupId === meetupId && application.status === "pending",
  ).length;
}

function getJoinButtonText(remaining, application) {
  if (remaining === 0) return "모집 완료";
  if (application?.status === "pending") return "입금 확인 대기";
  if (application?.status === "confirmed") return "참가 확정";
  return "참가 신청";
}

function renderUserPanel() {
  const user = getCurrentUser();
  document.querySelector("#loggedOutView").classList.toggle("hidden", Boolean(user));
  document.querySelector("#loggedInView").classList.toggle("hidden", !user);
  document.querySelector("#panelTitle").textContent = user ? "USER INFO" : "LOGIN";

  if (!user) return;

  document.querySelector("#profileAvatar").textContent = user.avatar;
  document.querySelector("#profileName").textContent = user.name;
  document.querySelector("#profileRole").textContent = isAdmin(user) ? "ADMIN 승인 완료" : "USER";

  const request = state.adminRequests.find((item) => item.userId === user.id);
  const requestStatus = document.querySelector("#adminRequestStatus");
  const requestForm = document.querySelector("#adminRequestForm");

  if (isAdmin(user)) {
    requestStatus.textContent = "이미 Admin 권한이 승인되어 모임을 등록할 수 있습니다.";
    requestForm.classList.add("hidden");
  } else if (request?.status === "pending") {
    requestStatus.textContent = "Admin 신청이 접수되었습니다. 승인 페이지에서 관리자가 확인할 수 있습니다.";
    requestForm.classList.add("hidden");
  } else {
    requestStatus.textContent = "모임을 직접 등록하려면 Admin 권한을 신청하세요.";
    requestForm.classList.remove("hidden");
  }

  const adminGate = document.querySelector("#adminGate");
  const adminTools = document.querySelector("#adminTools");
  if (isAdmin(user)) {
    adminGate.textContent = "Admin 페이지입니다. 신청 승인과 모임 등록을 관리할 수 있습니다.";
    adminTools.classList.remove("hidden");
  } else {
    adminGate.textContent = "Admin 승인 유저만 접근할 수 있습니다. USER 탭에서 신청해주세요.";
    adminTools.classList.add("hidden");
  }
  renderApprovalList();
  renderPaymentList();
}

function renderApprovalList() {
  const list = document.querySelector("#approvalList");
  const pending = state.adminRequests.filter((request) => request.status === "pending");
  if (!pending.length) {
    list.innerHTML = `<div class="empty-state">대기 중인 Admin 신청이 없습니다.</div>`;
    return;
  }
  list.innerHTML = pending
    .map(
      (request) => `
        <article class="approval-card">
          <strong>${escapeHtml(request.userName)}</strong>
          <p>${escapeHtml(request.reason)}</p>
          <button class="approve-button" type="button" data-approve-id="${request.id}">승인</button>
        </article>
      `,
    )
    .join("");

  document.querySelectorAll("[data-approve-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const request = state.adminRequests.find((item) => item.id === button.dataset.approveId);
      const user = state.users.find((item) => item.id === request?.userId);
      if (request && user) {
        request.status = "approved";
        user.role = "admin";
        persist();
        render();
      }
    });
  });
}

function renderPaymentList() {
  const list = document.querySelector("#paymentList");
  if (!list) return;

  const pending = state.meetupApplications.filter((application) => application.status === "pending");
  if (!pending.length) {
    list.innerHTML = `<div class="empty-state">입금 확인 대기 신청이 없습니다.</div>`;
    return;
  }

  list.innerHTML = pending
    .map((application) => {
      const meetup = state.meetups.find((item) => item.id === application.meetupId);
      return `
        <article class="approval-card">
          <strong>${escapeHtml(application.userName)}</strong>
          <p>${escapeHtml(meetup?.title ?? "삭제된 모임")}</p>
          <p>${escapeHtml(meetup?.account ?? "")}</p>
          <button class="approve-button" type="button" data-confirm-payment-id="${application.id}">
            입금 확인
          </button>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-confirm-payment-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const application = state.meetupApplications.find((item) => item.id === button.dataset.confirmPaymentId);
      if (application) {
        application.status = "confirmed";
        persist();
        render();
      }
    });
  });
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
  return String(value).replace(/[&<>"']/g, (char) => {
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
