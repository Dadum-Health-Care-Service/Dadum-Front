import React from "react";
import styles from "./Pagination.module.css";

export default function Pagination({
  currentPage = 1,
  totalPage = 1,
  nextPage,
  previousPage,
}) {
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPage;

  if (totalPage <= 1) return null;

  return (
    <nav
      className={`${styles["pagination"]} ${styles["md"]}`}
      aria-label="pagination"
    >
      <ul className={styles["list"]}>
        <li>
          <button
            type="button"
            className={styles["item"]}
            onClick={previousPage}
            disabled={!canPrev}
            aria-label="이전 페이지"
          >
            ‹
          </button>
        </li>

        <li>
          <span
            className={styles["item"]}
            aria-current="page"
            style={{ cursor: "default" }}
          >
            {currentPage} / {totalPage}
          </span>
        </li>

        <li>
          <button
            type="button"
            className={styles["item"]}
            onClick={nextPage}
            disabled={!canNext}
            aria-label="다음 페이지"
          >
            ›
          </button>
        </li>
      </ul>
    </nav>
  );
}
