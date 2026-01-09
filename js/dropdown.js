const highlightMatch = (text, query) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, `<mark>$1</mark>`);
};

const noMatchListItem = () => {
  const item = document.createElement("li");
  item.textContent = "Dünger nicht gefunden.";
  item.classList.add("no-items");
  return item;
};

const selectDropdownItem = (searchInput, resultList, itemName) => {
  searchInput.value = itemName;
  searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  resultList.classList.add("hidden");
  // Remove highlight from all items
  resultList.querySelectorAll("li").forEach((li) => li.classList.remove("highlighted"));
};

const attachDropdownBlurHandler = (inputElement) => {
  inputElement.addEventListener("blur", (event) => {
    const input = event.currentTarget;
    const dropdown = input.closest("div").querySelector("ul.dropdown-list");

    // Small delay to allow click events on dropdown items to complete
    setTimeout(() => {
      if (dropdown) {
        dropdown.classList.add("hidden");
      }
    }, 150);
  });
};

const attachDropdownKeyboardHandler = (inputElement) => {
  inputElement.addEventListener("keydown", (event) => {
    const dropdown = event.currentTarget.closest("div").querySelector("ul.dropdown-list");
    if (!dropdown || dropdown.classList.contains("hidden")) return;

    const items = dropdown.querySelectorAll("li:not(.no-items)");
    if (items.length === 0) return;

    const highlighted = dropdown.querySelector("li.highlighted");
    let currentIndex = highlighted ? Array.from(items).indexOf(highlighted) : -1;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        currentIndex = (currentIndex + 1) % items.length;
        items.forEach((item) => item.classList.remove("highlighted"));
        items[currentIndex].classList.add("highlighted");
        items[currentIndex].scrollIntoView({ block: "nearest" });
        break;

      case "ArrowUp":
        event.preventDefault();
        currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        items.forEach((item) => item.classList.remove("highlighted"));
        items[currentIndex].classList.add("highlighted");
        items[currentIndex].scrollIntoView({ block: "nearest" });
        break;

      case "Enter":
        event.preventDefault();
        if (highlighted) {
          const itemName = highlighted.dataset.itemName;
          if (itemName) {
            event.currentTarget.value = itemName;
            event.currentTarget.dispatchEvent(new Event("input", { bubbles: true }));
            dropdown.classList.add("hidden");
          }
        }
        break;

      case "Escape":
        event.preventDefault();
        dropdown.classList.add("hidden");
        break;
    }
  });
};

const attachDropdownEventHandlers = (dropdownInput, data) => {
  dropdownInput.addEventListener("focus", (event) => {
    event.currentTarget.select();
    renderDropdownItems(event.currentTarget, data, event.currentTarget.value.toLowerCase());
  });
  dropdownInput.addEventListener("input", (event) =>
    renderDropdownItems(event.currentTarget, data, event.currentTarget.value.toLowerCase())
  );
  attachDropdownBlurHandler(dropdownInput);
  attachDropdownKeyboardHandler(dropdownInput);
};

const renderDropdownItems = (searchInput, data, query = "") => {
  const resultList = searchInput.closest("div").querySelector("ul");
  resultList.innerHTML = "";
  resultList.classList.remove("hidden");
  resultList.setAttribute("tabindex", "-1"); // Make dropdown non-focusable

  const items = query === "" ? data : data.filter((item) => item.name.toLowerCase().includes(query));
  if (items.length === 0) {
    resultList.appendChild(noMatchListItem());
    return;
  }

  items.forEach((item, index) => {
    let li = document.createElement("li");
    li.innerHTML = highlightMatch(item.name, query);
    li.dataset.itemName = item.name;

    li.addEventListener("click", () => {
      selectDropdownItem(searchInput, resultList, item.name);
    });

    // Add hover effect
    li.addEventListener("mouseenter", () => {
      resultList.querySelectorAll("li").forEach((l) => l.classList.remove("highlighted"));
      li.classList.add("highlighted");
    });

    resultList.appendChild(li);
  });

  // Highlight first item by default
  if (items.length > 0) {
    resultList.querySelector("li").classList.add("highlighted");
  }
};

// Hide dropdown when clicking outside
document.addEventListener("click", (event) => {
  if (!event.target.closest(".dropdown")) {
    document.querySelectorAll(".dropdown-list").forEach((list) => {
      list.classList.add("hidden");
    });
  }
});
