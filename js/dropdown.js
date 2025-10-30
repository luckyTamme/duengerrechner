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
