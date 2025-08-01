let deleteUserId = null;
let editUserId = null;
let deleteDocId = null;
let editDocId = null;
let shareDocId = null;
let userEditedIsCurrent = false;
let deleteSharedUserId = null;
let deleteSharedUploadId = null;

function showMenuBar() {
  const menuBar = document.getElementById("menu-bar");
  fetch("./menu-bar.html")
    .then((response) => response.text())
    .then((menuHtml) => {
      menuBar.innerHTML = menuHtml;
    });

  const currentPage = window.location.pathname.split("/").pop();
  document.querySelectorAll(".menu-bar_item").forEach((item) => {
    if (item.dataset.page === currentPage) {
      item.classList.add("active");
    }
  });
}

function openPopup() {
  let popup = document.getElementById("popupOverlay");
  document.getElementById("openPopupBtn").addEventListener("click", () => {
    popup.style.display = "block";
  });
}

function openModal(id) {
  let popup = document.getElementById(id);
  const modal = new bootstrap.Modal(popup);
  modal.show();

}

function closeModal(id) {
  let popup = document.getElementById(id);
  const modal = bootstrap.Modal.getInstance(popup);
  if (modal) {
    modal.hide();
  }
}

function openConfirmDeletePopup(id) {
  deleteUserId = id; // Store the id of the user to be deleted

  openModal("deleteUserPopup");
}

function openConfirmDocDeletePopup(id) {
  openModal("deleteMyDocument");
}

function closePopup(overlayId) {
  let popup = document.getElementById(overlayId);
  popup.style.display = "none";
}

function redirect(path) {
  window.location.href = path;
}

function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
    page.style.display = "none";
  });

  // Show selected page
  let pageToShow = document.getElementById(pageId);
  pageToShow.classList.add("active");
  pageToShow.style.display = "block";

  // If manage users page is shown, populate data
  if (pageId === "userManagement") {
    populateUserTable();
  }
  if (pageId === "documentManagement") {
    populateMyUploadsTable();
    populateSharedUploadsTable();
  }
  if (pageId === "sharedDocumentManagement") {
    populateUploadSharingTable();
    populateChooseUserForShare();
  }
}

function openEditUserPage(id) {
  editUserId = id;

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find((user) => user.id === editUserId);
  // Populate form fields
  if (!user) {
    alert("User not found");
    return;
  }
  document.getElementById("edit_fullName").value = user.userName;
  document.getElementById("edit_email").value = user.email;
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser && currentUser.email === user.email) {
    userEditedIsCurrent = true;
  }
  showPage("editUser");
}

function openEditDocumentPage(id) {
  editDocId = id;

  const uploads = JSON.parse(localStorage.getItem("uploads")) || [];
  const upload = uploads.find((upload) => upload.id === editDocId);

  if (!upload) {
    alert("Document not found");
    return;
  }
  // Populate form fields
  document.getElementById("edit_fileDesc").value = upload.fileDescription;
  showPage("editMyDocument");
}

function openShareDocumentPage(id) {
  shareDocId = id;

  const uploads = JSON.parse(localStorage.getItem("uploads")) || [];
  const upload = uploads.find((upload) => upload.id === shareDocId);

  if (!upload) {
    alert("Document not found");
    return;
  }
  const uploadSharingTableTitle = document.getElementById(
    "uploadSharingTableTitle"
  );
  uploadSharingTableTitle.textContent = `Upload Sharing : ${upload.fileName}`;
  showPage("sharedDocumentManagement");
}

function saveEditedUser() {
  const updatedName = document.getElementById("edit_fullName").value.trim();
  const updatedEmail = document.getElementById("edit_email").value.trim();

  if (editUserId !== null) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (
      users.some(
        (user) => user.email === updatedEmail && user.id !== editUserId
      )
    ) {
      alert("User with this email already exists");
      return;
    }
    const userIndex = users.findIndex((user) => user.id === editUserId);
    if (userIndex !== -1) {
      users[userIndex].userName = updatedName;
      users[userIndex].email = updatedEmail;
    }

    localStorage.setItem("users", JSON.stringify(users));
    editUserId = null;
    if (userEditedIsCurrent) {
      // Update current user in localStorage
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (currentUser) {
        currentUser.userName = updatedName;
        currentUser.email = updatedEmail;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
      }
      userEditedIsCurrent = false; // Reset the flag
    }

    // Switch back to table view
    showPage("userManagement");
    cancelOperation();
  }
}

function saveEditedDocument() {
  const updatedFileDesc = document.getElementById("edit_fileDesc").value.trim();
  if (editDocId !== null) {
    const uploads = JSON.parse(localStorage.getItem("uploads")) || [];
    if (
      uploads.some(
        (upload) =>
          upload.fileDescription === updatedFileDesc && upload.id !== editDocId
      )
    ) {
      alert("File with this description already exists");
      return;
    }
    const uploadIndex = uploads.findIndex((upload) => upload.id === editDocId);
    if (uploadIndex !== -1) {
      uploads[uploadIndex].fileDescription = updatedFileDesc;
    }

    localStorage.setItem("uploads", JSON.stringify(uploads));
    editDocId = null;

    // Switch back to table view
    showPage("documentManagement");
    cancelOperation();
  }
}

function validateRegisterForm(event) {
  event.preventDefault();
  const form = document.querySelector(".register-form");
  const userName = form.querySelector("#name").value;
  const email = form.querySelector("#email").value;
  const password = form.querySelector("#password").value;
  const confirmPassword = form.querySelector("#confirm_password").value;

  if (
    userName === "" ||
    email === "" ||
    password === "" ||
    confirmPassword === ""
  ) {
    alert("Please enter all fields to register.");
    return;
  }
  if (!email.endsWith("@gmail.com") || email.length <= "@gmail.com".length) {
    alert("Please enter a valid email address to register.");
    return;
  }
  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  let isUserNew = addNewUserData(userName, email, password);
  if (isUserNew) {
    form.action = "register-success.html";
    form.submit();
  } else {
    alert("User with this Email Id already exists.");
  }
}

function addNewUserData(userName, email, password) {
  const userData = {
    id: Date.now() + Math.floor(Math.random() * 10000), // unique number
    email: email,
    userName: userName,
    password: password,
  };

  const users = JSON.parse(localStorage.getItem("users")) || [];
  if (users.some((user) => user.email === email)) {
    return false; // User already exists
  }
  users.push(userData);
  localStorage.setItem("users", JSON.stringify(users));
  return true;
}

function validateLoginForm(event) {
  event.preventDefault();
  const form = document.querySelector(".login-form");
  const email = form.querySelector("#email").value;
  const password = form.querySelector("#password").value;

  if (email === "" || password === "") {
    alert("Please enter both email and password to login.");
    return;
  }
  if (!email.endsWith("@gmail.com") || email.length <= "@gmail.com".length) {
    alert("Please enter a valid email address");
    return;
  }

  const storedUserData = localStorage.getItem("users");
  if (!storedUserData) {
    alert("User not found");
    return;
  }

  const userData = JSON.parse(storedUserData);
  if (userData.every((user) => user.email !== email)) {
    alert("User not registered with this email. Please register first.");
    redirect("./home.html");
    return;
  } else {
    if (userData.every((user) => user.password !== password)) {
      alert("Incorrect password");
      return;
    }
    const currentUser = userData.find((user) => user.email === email);
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    form.action = "login-success.html";
    form.submit();
  }
}

function populateUserTable() {
  //document.getElementById("deleteUserPopup").style.display = "none";
  const tableBody = document.getElementById("userTableBody");
  const users = JSON.parse(localStorage.getItem("users")) || [];
  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = "";

  // Inserting each user into table
  users.forEach((user) => {
    const row = document.createElement("tr");

    const nameTd = document.createElement("td");
    nameTd.textContent = user.userName;

    const emailTd = document.createElement("td");
    emailTd.textContent = user.email;

    const editDeleteTd = document.createElement("td");
    // Create Edit link (optional)
    const editLink = document.createElement("a");
    editLink.href = `#edit/${user.id}`;
    editLink.textContent = "Edit";
    editLink.onclick = () => {
      openEditUserPage(user.id);
    };

    // Create Delete link
    const deleteLink = document.createElement("a");
    deleteLink.href = `#delete/${user.id}`;
    deleteLink.textContent = "Delete";
    deleteLink.onclick = () => {
      openConfirmDeletePopup(user.id);
    };

    // Add both links
    editDeleteTd.appendChild(editLink);
    editDeleteTd.appendChild(document.createTextNode(" | "));
    editDeleteTd.appendChild(deleteLink);

    row.appendChild(nameTd);
    row.appendChild(emailTd);
    row.appendChild(editDeleteTd);

    tableBody.appendChild(row);
  });
}

function cancelOperation() {
  // Reset hash
  history.pushState(
    "",
    document.title,
    window.location.pathname + window.location.search
  );
}

function validateEditUserForm(event) {
  event.preventDefault();
  const form = document.querySelector("edit-user-form");
  const email = form.querySelector("#edit_email").value;
  const fullName = form.querySelector("#edit_fullName").value;

  const storedUserData = localStorage.getItem("users");
  if (!storedUserData) {
    alert("User not found");
    return;
  }

  const userData = JSON.parse(storedUserData);
  if (userData.some((user) => user.email === email)) {
    alert("User with this email already exists");
    return;
  }
  if (fullName === "" || email === "") {
    alert("Please enter both name and email to edit user.");
    return;
  }
  userData;
}

function validateEditDocumentForm(event) {
  event.preventDefault();
  const form = document.querySelector("edit-document-form");
  const fileDesc = form.querySelector("#edit_fileDesc").value;
  const storedUploadData = localStorage.getItem("uploads");
  if (!storedUploadData) {
    alert("No uploads found");
    return;
  }
  const uploadData = JSON.parse(storedUploadData);
  if (uploadData.some((upload) => upload.fileDescription === fileDesc)) {
    alert("File with this description already exists.");
    return;
  }
  if (fileDesc === "") {
    alert("Please enter a file description to edit document.");
    return;
  }
  uploadData;
}

function confirmDeleteUser() {
  if (deleteUserId !== null) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    users.splice(
      users.findIndex((user) => user.id === deleteUserId),
      1
    );
    localStorage.setItem("users", JSON.stringify(users));
    populateUserTable(); // Refresh the table
    deleteUserId = null;
    closeModal("deleteUserPopup");
  }
}

function confirmDeleteDocument() {
  if (deleteDocId !== null) {
    const uploads = JSON.parse(localStorage.getItem("uploads")) || [];
    uploads.splice(
      uploads.findIndex((upload) => upload.id === deleteDocId),
      1
    );
    localStorage.setItem("uploads", JSON.stringify(uploads));
    populateMyUploadsTable();
    populateSharedUploadsTable(); // Refresh the table
    deleteDocId = null;
    closeModal("deleteMyDocument");
  }
}

function uploadFile() {
  const fileDescription = document.getElementById("fileDesc").value;
  const fileInput = document.getElementById("uploadFileInput");
  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const base64Data = e.target.result; // Base64 string
      const isSuccess = addNewDocument(fileDescription, file.name, base64Data);
      if (isSuccess) {
        document.getElementById("fileDesc").value = "";
        document.getElementById("uploadFileInput").value = "";

        closeModal("upload-popup");
        showPage("documentManagement");
      }
    };
    reader.readAsDataURL(file);
  }
}

function addNewDocument(fileDescription, fileName, fileData) {
  try {
    const upload = {
      id: Date.now() + Math.floor(Math.random() * 10000), // unique number
      fileDescription: fileDescription,
      fileName: fileName,
      data: fileData,
      uploadedBy: JSON.parse(localStorage.getItem("currentUser")).email,
      //uploadDate: new Date().toISOString() // Add timestamp
    };

    const uploads = JSON.parse(localStorage.getItem("uploads")) || [];
    uploads.push(upload);
    localStorage.setItem("uploads", JSON.stringify(uploads));

    return true; // Return success status
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    alert("Error saving file. Storage might be full.");
    return false;
  }
}

function populateMyUploadsTable() {
  const tableBody = document.getElementById("myUploadsTableBody");
  const allUploads = JSON.parse(localStorage.getItem("uploads")) || [];
  if (!tableBody) {
    return;
  }

  const myUploads = allUploads.filter((upload) => {
    return (
      upload.uploadedBy ===
      JSON.parse(localStorage.getItem("currentUser")).email
    );
  });

  if (!myUploads || myUploads.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='3'>No uploads found</td></tr>";
    return;
  }

  tableBody.innerHTML = "";

  // Inserting each user into table
  myUploads.forEach((upload) => {
    const row = document.createElement("tr");

    const labelTd = document.createElement("td");
    labelTd.textContent = upload.fileDescription;

    const fileNameTd = document.createElement("td");
    fileNameTd.textContent = upload.fileName;

    const editDeleteShareTd = document.createElement("td");

    // Create Edit link (optional)
    const editLink = document.createElement("a");
    editLink.href = `#edit/${upload.id}`;
    editLink.textContent = "Edit";
    editLink.onclick = () => {
      openEditDocumentPage(upload.id);
    };

    // Create Delete link
    const deleteLink = document.createElement("a");
    deleteLink.href = `#delete/${upload.id}`;
    deleteLink.textContent = "Delete";
    deleteLink.onclick = () => {
      openConfirmDocDeletePopup(upload.id);
    };

    // Create Share link
    const shareLink = document.createElement("a");
    shareLink.href = `#share/${upload.id}`;
    shareLink.textContent = "Share";
    shareLink.onclick = () => {
      openShareDocumentPage(upload.id);
    };

    // Add both links
    editDeleteShareTd.appendChild(editLink);
    editDeleteShareTd.appendChild(document.createTextNode(" | "));
    editDeleteShareTd.appendChild(deleteLink);
    editDeleteShareTd.appendChild(document.createTextNode(" | "));
    editDeleteShareTd.appendChild(shareLink);

    row.appendChild(labelTd);
    row.appendChild(fileNameTd);
    row.appendChild(editDeleteShareTd);

    tableBody.appendChild(row);
  });
}

function populateSharedUploadsTable() {
  const tableBody = document.getElementById("sharedUploadsTableBody");
  const allUploads = JSON.parse(localStorage.getItem("uploads")) || [];
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!tableBody) {
    return;
  }

  const sharedUploads = allUploads.filter((upload) => {
    return (
      upload.uploadedBy !==
        JSON.parse(localStorage.getItem("currentUser")).email &&
      upload.sharedWith &&
      upload.sharedWith.length > 0 &&
      upload.sharedWith.includes(currentUser.id)
    );
  });

  if (!sharedUploads || sharedUploads.length === 0) {
    tableBody.innerHTML =
      "<tr><td colspan='3'>No shared uploads found</td></tr>";
    return;
  }

  tableBody.innerHTML = "";

  // Inserting each user into table
  sharedUploads.forEach((upload) => {
    const row = document.createElement("tr");

    const labelTd = document.createElement("td");
    labelTd.textContent = upload.fileDescription;

    const fileNameTd = document.createElement("td");
    fileNameTd.textContent = upload.fileName;

    const sharedByTd = document.createElement("td");
    sharedByTd.textContent = upload.uploadedBy;

    row.appendChild(labelTd);
    row.appendChild(fileNameTd);
    row.appendChild(sharedByTd);

    tableBody.appendChild(row);
  });
}

function populateChooseUserForShare() {
  const dropdown = document.getElementById("chooseUserForShareId");
  if (!dropdown) return;
  dropdown.innerHTML = ""; // Clear previous options

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  users
    .filter((user) => currentUser && user.id !== currentUser.id)
    .forEach((user) => {
      const option = document.createElement("option");
      option.value = user.userName;
      option.textContent = user.userName;
      dropdown.appendChild(option);
    });
}

function addShare() {
  const addShareBtn = document.getElementById("addShareBtn");
  if (!addShareBtn) return;

  const selectedUserNameForShare = document.getElementById(
    "chooseUserForShareId"
  ).value;
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const selectedUserForShare = users.find(
    (user) => user.userName === selectedUserNameForShare
  );
  if (!selectedUserForShare) {
    alert("Please select a user to share with.");
    return;
  }
  addNewShareData(selectedUserForShare);
}

function addNewShareData(sharedWithUser) {
  const uploads = JSON.parse(localStorage.getItem("uploads")) || [];
  const upload = uploads.find((upload) => upload.id === shareDocId);

  if (!upload) {
    alert("Upload not found");
    return;
  }

  // Check if the share already exists
  if (upload.sharedWith && upload.sharedWith.includes(sharedWithUser.id)) {
    alert("This document is already shared with " + sharedWithUser.userName);
    return;
  }

  // Add the shared user to the upload
  if (!upload.sharedWith) {
    upload.sharedWith = [];
  }
  upload.sharedWith.push(sharedWithUser.id);

  localStorage.setItem("uploads", JSON.stringify(uploads));
  alert("Document shared successfully with " + sharedWithUser.userName);
  populateUploadSharingTable();
}

function populateUploadSharingTable() {
  const tableBody = document.getElementById("uploadSharingTableBody");
  const uploads = JSON.parse(localStorage.getItem("uploads")) || [];
  const upload = uploads.find((upload) => upload.id === shareDocId);
  const users = JSON.parse(localStorage.getItem("users")) || [];

  if (!tableBody || !upload) {
    return;
  }

  tableBody.innerHTML = "";

  if (!upload.sharedWith || upload.sharedWith.length === 0) {
    tableBody.innerHTML =
      "<tr><td colspan='2'>No users sharing this file yet.</td></tr>";
    return;
  }

  // Inserting each user into table
  upload.sharedWith.forEach((userId) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      const row = document.createElement("tr");

      const sharedUserTd = document.createElement("td");
      sharedUserTd.textContent = user.userName;

      const actionTd = document.createElement("td");
      // Create Remove link
      const removeLink = document.createElement("a");
      removeLink.href = `#share/${upload.id}#share-remove`;
      removeLink.textContent = "Remove";
      //removeLink.setAttribute("data-bs-target", "#removeSharedUserPopup");
      removeLink.onclick = () => {
        openConfirmRemoveSharedUserPopup(upload.id, user.id);
      };

      actionTd.appendChild(removeLink);
      row.appendChild(sharedUserTd);
      row.appendChild(actionTd);
      tableBody.appendChild(row);
    }
  });
}

function openConfirmRemoveSharedUserPopup(uploadId, userId) {
  deleteSharedUserId = userId; // Store the id of the shared user to be removed
  deleteSharedUploadId = uploadId; // Store the id of the upload for which the shared user is to be removed
  openModal("removeSharedUserPopup");
}

function confirmRemoveSharedUser() {
  if (deleteSharedUserId !== null && deleteSharedUploadId !== null) {
    const uploads = JSON.parse(localStorage.getItem("uploads")) || [];
    const upload = uploads.find((upload) => upload.id === deleteSharedUploadId);

    if (upload && upload.sharedWith) {
      const userIndex = upload.sharedWith.indexOf(deleteSharedUserId);
      if (userIndex !== -1) {
        upload.sharedWith.splice(userIndex, 1);
        localStorage.setItem("uploads", JSON.stringify(uploads));
        populateUploadSharingTable();
      } else {
        alert("User not found in shared list.");
      }
    } else {
      alert("Upload not found or no users shared with it.");
    }

    deleteSharedUserId = null;
    deleteSharedUploadId = null;
    closeModal("removeSharedUserPopup");
  }
}

function adjustHrefLink(stringToRemove) {
  const currentHref = window.location.href;
  if (currentHref.includes(stringToRemove)) {
    const newHref = currentHref.split(stringToRemove)[0];
    window.location.href = newHref;
  }
}

function restoreIds() {
  shareDocId = null;
  cancelOperation();
}

function getCurrentDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months start at 0
  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `[${year}-${month}-${day} ${hours}-${minutes}-${seconds}]`;
}

updateChat = function (message) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const chatHistory = {
    id: Date.now() + Math.floor(Math.random() * 10000), // unique number
    timeStamp: getCurrentDateTime(),
    userName: currentUser.userName,
    message: message,
  };

  // Save chat history to localStorage
  const chatHistoryData = JSON.parse(localStorage.getItem("chatHistory")) || [];
  chatHistoryData.push(chatHistory);
  localStorage.setItem("chatHistory", JSON.stringify(chatHistoryData));
};

function refreshChatBox() {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = ""; // Clear the chat box

  const allChats = JSON.parse(localStorage.getItem("chatHistory")) || [];
  allChats.forEach((chat) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message";
    messageDiv.innerHTML = `<span class="timestamp">${chat.timeStamp}</span> <b>${chat.userName}:</b> ${chat.message}`;
    chatBox.appendChild(messageDiv);
  });

  // Scroll to the bottom of the chat box
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value.trim();
  if (message) {
    updateChat(message);
    messageInput.value = ""; // Clear the input field
    refreshChatBox();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  let element = document.getElementById("current_user");
  const storedCurrentUser = localStorage.getItem("currentUser");
  if (!storedCurrentUser) {
    return;
  }
  const currentUserEmail = JSON.parse(storedCurrentUser).email;
  if (element) {
    element.innerHTML = "<b>Welcome!</b> " + currentUserEmail;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("status") == "logged_out") {
    document.getElementById("logoutMessage").textContent =
      "You have been logged out";
    localStorage.removeItem("currentUser");
  }
});
