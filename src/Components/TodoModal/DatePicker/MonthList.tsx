import React, { useMemo, useContext, useRef, useEffect } from "react";
import "./DatePicker.scss";
import { v4 as uuidv4 } from "uuid";
import { TodoContext } from "src/Context/TodoContext";
import { DaysInWeek, MonthShortHand } from "src/interface";
import { TODO_PROPERTIES, getCurrentDayInWeek, getDaysInMonth } from "src/Utils";

type Props = {
  year: number;
  month: number;
  currentDate?: Date;
  startPos?: number;
};

/**
 *
 * @param currentDate current date
 * @param year current year
 * @param month current month (0 - 11)
 * @param day current day
 * @returns check if current date is actual current date
 */
const isCurrentDate = (
  currentDate: Date,
  year: number,
  month: number,
  day: number
) => {
  if (
    currentDate?.getDate() === day &&
    currentDate?.getMonth() === month &&
    currentDate?.getFullYear() === year
  ) {
    return true;
  }
  return false;
};

/**
 *
 * @param currentDate current date
 * @param year current year
 * @param month current month (0 - 11)
 * @param day current day
 * @returns check if each date in month is validated by the current date
 */
const isDisableDate = (
  currentDate: Date,
  year: number,
  month: number,
  day: number
) => {
  if (
    (currentDate?.getDate() as number) > day &&
    currentDate?.getMonth() === month &&
    currentDate?.getFullYear() === year
  ) {
    return true;
  }
  return false;
};

/**
 *
 * @param props include: current year, current month (0 - 11), current date
 * @returns List of dates in the month and days of the week
 */
export const MonthList: React.FC<Props> = ({ year, month, currentDate }) => {
  const days = useMemo(() => {
    const allDays = getDaysInMonth(year, month);

    // handle to show what day is it now
    {
      let dayBeforeFirstDate = getCurrentDayInWeek(year, month, 1)
        ? getCurrentDayInWeek(year, month, 1) - 1
        : 6;

      while (dayBeforeFirstDate--) {
        allDays.unshift(-1);
      }
    }

    return allDays;
  }, [month, year]);

  const {
    todo,
    handleChangeTodo,
    setIsOpenDueDate,
    isOpenDueDate,
    setShowDueDate,
    dateList,
    setMonth,
    setYear,
  } = useContext(TodoContext);

  // save ref of each month shown in the calendar
  const ref = useRef<HTMLDivElement>(null);

  // calculate check point
  const startPosition = document
    .querySelector(".date-picker hr")
    ?.getBoundingClientRect().top as number;

  // handle scroll to change show month and year
  useEffect(() => {
    window.addEventListener(
      "scroll",
      () => {
        const currentPosition = ref.current?.getBoundingClientRect()
          .top as number;

        if (currentPosition - 10 <= startPosition) {
          setMonth(month);
          setYear(year);
        }
      },
      true
    );

    return () => {
      removeEventListener("scroll", () => {
        console.log("REMOVE EVENT");
      });
    };
  }, [ref, month, setMonth, startPosition, setYear, year]);

  // Update month and year when due date change
  // useEffect(() => {
  //   setMonth(
  //     new Date(todo.dueDate).getMonth() || (currentDate?.getMonth() as number)
  //   );
  //   setYear(
  //     new Date(todo.dueDate).getFullYear() || (currentDate?.getFullYear() as number)
  //   );
  // }, [todo.dueDate, currentDate, setMonth, setYear]);

  // handle to add id for current month
  useEffect(() => {
    const allSpanElements = ref.current?.querySelectorAll("span");
    const spanArray = allSpanElements && Array.from(allSpanElements);
    const isContain = spanArray?.some((span) =>
      span.classList.contains("active-date")
    );
    if (isContain && ref.current) {
      ref.current.id = "current-month-choose";
    } else {
      ref.current?.removeAttribute("id");
    }

    // handle to add id for current month when cancel current due date
    const firstMonthChild =
      ref.current?.parentElement?.parentElement?.firstElementChild;
    if (firstMonthChild) {
      if (!todo.dueDate) {
        firstMonthChild.id = "current-month-choose";
      } else firstMonthChild.removeAttribute("id");
    }
  }, [ref, isOpenDueDate, todo.dueDate]);

  const handleChooseDueDate = (day: number) => {
    const date = new Date(year, month, day + 1).toDateString();
    const findDate = dateList.find((dateItem) => dateItem.date === date);
    if (findDate) {
      handleChangeTodo(TODO_PROPERTIES.DUE_DATE,findDate.date);
      setShowDueDate({
        color: findDate.color,
        text: findDate.content === "No Date" ? "Due Date" : findDate.content,
      });
    } else {
      handleChangeTodo(TODO_PROPERTIES.DUE_DATE, date);
      setShowDueDate({
        color: "#692ec2",
        text: DaysInWeek[getCurrentDayInWeek(year, month, day + 1)],
      });
    }
    
    setIsOpenDueDate(false);
  };

  return (
    <div>
      {(month !== currentDate?.getMonth() ||
        (month === currentDate?.getMonth() &&
          year !== currentDate?.getFullYear())) && (
        <>
          {/* Hide month and year for current month of current year */}
          <p className="font-large text-extra-small m-[10px]">
            {MonthShortHand[month]}
          </p>
          <hr className="my-[6px]" />
        </>
      )}
      {/* Show all date in month -> sort by day in week */}
      <div className="flex flex-wrap" ref={ref}>
        {days.map((day) => {
          if (day >= 0) {
            return (
              <span
                key={`${day + 1}/${month + 1}/${year}`}
                className={`basis-[14.285%] py-[4px] px-[6px] text-center text-extra-small cursor-pointer${
                  // only choose date after current date
                  isDisableDate(currentDate as Date, year, month, day + 1)
                    ? " disable-date"
                    : ""
                }${
                  // highlight current date
                  isCurrentDate(currentDate as Date, year, month, day + 1)
                    ? " text-primary font-medium"
                    : ""
                }${
                  // active choose date and add hover for others date
                  todo.dueDate === new Date(year, month, day + 1).toDateString()
                    ? " active-date"
                    : " hover-date"
                }`}
                onClick={() => {
                  handleChooseDueDate(day);
                }}
              >
                <p>{day + 1}</p>
              </span>
            );
          }
          return (
            // show empty field
            <span
              key={uuidv4()}
              className="basis-[14.285%] py-2 text-center text-extra-small"
            />
          );
        })}
      </div>
    </div>
  );
};
