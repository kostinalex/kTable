import { formatDate, formatNumber } from "@angular/common";
import {
  Component,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  IterableDiffers,
  KeyValueDiffer,
  KeyValueDiffers,
  LOCALE_ID,
  OnInit,
  Output,
} from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "kTable",
  templateUrl: "./k-table.component.html",
  styleUrls: ["./k-table.component.css"],
})
export class KTableComponent implements OnInit {
  @Input() data: Array<Object> = [];
  @Input() format: any;

  @Output() itemSelected = new EventEmitter<any>();
  @Output() deleteItem = new EventEmitter<any>();
  @Output() refresh = new EventEmitter<any>();

  dataSorted;
  properties = [];
  page = 1;
  itemsPerPage = 30;
  numPerPage = [10, 20, 30, 50];

  filters = {
    sort: "",
    sortToggle: 1,
    searchWord: "",
  };

  showFiltersForProp = "";

  @HostListener("window:click", ["$event"])
  clickEvent(event: KeyboardEvent) {
    let elem = event.target as HTMLElement;

    // console.log("===>event", elem.className);
    // if (elem.className != "filterDiv") {
    //   this.showFiltersForProp = "";
    // }
  }

  constructor(private router: Router, private differs: KeyValueDiffers) {}

  ngOnInit(): void {
    this.getProperties();

    if (this.format && this.format.itemsPerPage) {
      this.itemsPerPage = this.format.itemsPerPage;
    }

    if (localStorage.getItem("itemsPerPage")) {
      this.itemsPerPage = +localStorage.getItem("itemsPerPage");
    }

    if (!this.numPerPage.includes(this.itemsPerPage)) {
      this.numPerPage.push(this.itemsPerPage);
    }

    this.numPerPage = this.numPerPage.sort((a, b) => (a > b ? 1 : -1));
  }

  getProperties() {
    if (!this.data) {
      return [];
    }

    let propIds = [];

    let ignore = [];

    for (let item of this.data) {
      for (let prop in item) {
        if (
          !(
            this.format &&
            this.format.ignore &&
            this.format.ignore.includes(prop)
          )
        ) {
          propIds.push(prop);
        }
      }
    }

    propIds = [...new Set(propIds)];

    //make list of props and assign names
    for (let id of propIds) {
      this.properties.push({
        id,
        name: this.makeHeader(id),
      });
    }

    //copy all specified props
    if (this.format && this.format.properties) {
      for (let prop of this.properties) {
        let np = this.format.properties.find((c) => c.id == prop.id);
        if (np) {
          for (let index in np) {
            prop[index] = np[index];
          }
        }
      }
    }

    //order

    if (this.format && this.format.order) {
      let orderedProps = [];
      for (let prop of this.format.properties) {
        let nProp = this.properties.find((c) => c.id == prop.id);
        if (nProp) {
          orderedProps.push(nProp);
        }
      }

      this.properties = orderedProps;
    }

    //select column
    if (this.data) {
      let copyOfData = JSON.parse(JSON.stringify(this.data));
      this.data = [];
      for (let item of copyOfData) {
        this.data.push({
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
          selected11: false,
          item,
        });
      }
    }

    //create options
    for (let prop of this.properties) {
      if (prop.filter) {
        if (this.filters[prop.id] == undefined) {
          this.filters[prop.id] = {};
        }
        this.filters[prop.id].from = "";
        this.filters[prop.id].to = "";

        this.filters[prop.id].selectAll = true;
        this.filters[prop.id].options = [
          ...new Set(this.data.map((c) => c["item"][prop.id])),
        ]
          .sort((a, b) => (a > b ? 1 : -1))
          .map((c) => ({
            selected: true,
            value: c,
          }));
      }
    }

    this.dataSorted = JSON.parse(JSON.stringify(this.data));

    // console.log("====>this.filters", this.filters);
  }

  //#region FILTERS

  filtersChanged() {
    // console.log("====>filtersChanged()", this.filters);

    this.dataSorted = JSON.parse(JSON.stringify(this.data));

    //options

    for (let fil in this.filters) {
      if (
        fil != "sortToggle" &&
        fil != "searchWord" &&
        fil != "sort" &&
        this.filters[fil] &&
        this.filters[fil].options &&
        this.filters[fil].options.length > 0
      ) {
        let notSelected = this.filters[fil].options
          .filter((c) => c.selected == false)
          .map((c) => c.value);

        if (notSelected.length > 0) {
          this.dataSorted = this.dataSorted.filter(
            (c) => !notSelected.includes(c.item[fil])
          );
        }

        //from to

        if (this.filters[fil].from != "") {
          let apply = this.filters[fil].from;
          let specificProperty = this.properties.find((c) => c.id == fil);

          if (specificProperty.number) {
            apply = +apply;
            this.dataSorted = this.dataSorted.filter(
              (c) => +c.item[fil] >= apply
            );
          }

          if (specificProperty.date) {
            apply = new Date(apply);
            this.dataSorted = this.dataSorted.filter(
              (c) => new Date(c.item[fil]) >= apply
            );
          }
        }

        if (this.filters[fil].to != "") {
          let apply = this.filters[fil].to;
          let specificProperty = this.properties.find((c) => c.id == fil);

          if (specificProperty.number) {
            apply = +apply;
            this.dataSorted = this.dataSorted.filter(
              (c) => +c.item[fil] <= apply
            );
          }

          if (specificProperty.date) {
            apply = new Date(apply);
            this.dataSorted = this.dataSorted.filter(
              (c) => new Date(c.item[fil]) <= apply
            );
          }
        }
      }
    }

    //search
    if (this.filters.searchWord != "") {
      this.dataSorted = this.dataSorted.filter(
        (c) =>
          c.item &&
          JSON.stringify(c.item)
            .toUpperCase()
            .includes(this.filters.searchWord.toUpperCase())
      );
    }

    //sort
    if (this.filters.sort != "") {
      this.dataSorted = this.dataSorted.sort((a, b) =>
        a.item[this.filters.sort] > b.item[this.filters.sort]
          ? this.filters.sortToggle
          : -this.filters.sortToggle
      );
    }

    // console.log("====>this.dataSorted", this.dataSorted);
  }

  removeFilter(fil) {
    if (fil != "sortToggle" && fil != "searchWord" && fil != "sort") {
      //options
      if (
        this.filters[fil].options &&
        this.filters[fil].options.filter((c) => c.selected == false).length > 0
      ) {
        for (let option of this.filters[fil].options) {
          option.selected = true;
        }
        this.filters[fil].selectAll = true;
      }

      //from to

      if (this.filters[fil].from != "") {
        this.filters[fil].from = "";
      }

      if (this.filters[fil].to != "") {
        this.filters[fil].to = "";
      }
    }
    //others
    else {
      this.filters[fil] = "";
    }
    this.filtersChanged();
  }

  getFilters() {
    let filters = [];
    for (let fil in this.filters) {
      if (fil == "sort" && this.filters.sort != "") {
        filters.push(fil);
      } else if (fil == "searchWord" && this.filters.searchWord != "") {
        filters.push(fil);
      }
      // filters by property
      else if (fil != "sortToggle" && fil != "searchWord" && fil != "sort") {
        if (
          this.filters[fil] &&
          this.filters[fil].options &&
          this.filters[fil].options.length > 0
        ) {
          if (
            this.filters[fil].options.filter((c) => c.selected == false)
              .length > 0
          ) {
            filters.push(fil);
          }
        }

        if (
          this.filters[fil] &&
          (this.filters[fil].from != "" || this.filters[fil].to != "")
        ) {
          filters.push(fil);
        }
      }
    }

    filters = [...new Set(filters)];

    // console.log("====>filters", filters);

    return filters;
  }

  getFilterValue(fil) {
    let result = this.filters[fil];

    let propertyName = this.filters[fil];

    let prop = this.properties.find((c) => c.id == propertyName);
    if (prop) {
      propertyName = prop.name;
    }

    if (fil == "searchWord") {
      result = "Search Word: '" + result + "'";
    } else if (fil == "sort") {
      result =
        "Sort by: '" +
        propertyName +
        "' " +
        (this.filters.sortToggle == 1 ? "A-Z" : "Z-A");
    } else if (this.filters[fil]) {
      result = "";

      if (this.filters[fil].from != "" || this.filters[fil].to != "") {
        result = `Column '${this.properties.find((c) => c.id == fil)?.name}'${
          this.filters[fil].from != ""
            ? ` from '${this.filters[fil].from}'`
            : ""
        }${this.filters[fil].to != "" ? ` to '${this.filters[fil].to}'` : ""}`;
      }

      //not selected options

      if (
        this.filters[fil].options &&
        this.filters[fil].options.filter((c) => c.selected == false).length > 0
      ) {
        result =
          (result != "" ? result + ". " : "") +
          `Not all options selected for '${
            this.properties.find((c) => c.id == fil)?.name
          }'`;
      }
    }

    return result;
  }

  optionCheckboxClicked(filtersProp, optionValue) {
    let changedOption = this.filters[filtersProp].options.find(
      (c) => c.value == optionValue
    );

    changedOption.selected = !changedOption.selected;
    this.filtersChanged();
  }

  selectAllOptions(filtersProp) {
    for (let option of this.filters[filtersProp].options) {
      option.selected = this.filters[filtersProp].selectAll;
    }

    this.filtersChanged();
  }

  filtersClickShowDropDown(propId, className) {
    if (className == "filterDiv") {
      if (this.showFiltersForProp == "") {
        this.showFiltersForProp = propId;
      } else {
        this.showFiltersForProp = "";
      }
      this.filtersChanged();
    }
  }

  //#endregion

  makeHeader(str: string) {
    var result = "";

    for (var i = 0; i < str.length; i++) {
      var character = "" + str.charAt(i);
      if (character.toUpperCase() == character) {
        result = result + " " + character;
      } else {
        result = result + character;
      }
    }

    return this.capitalizeFirstLetter(result);
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  sum(propId) {
    let sum = undefined;

    if (
      this.format &&
      this.format.sum &&
      this.format.sum.length > 0 &&
      this.format.sum.includes(propId)
    ) {
      sum = 0;
      for (let item of this.dataSorted) {
        sum = sum + +item.item[propId];
      }
    }

    return sum;
  }

  refreshF() {
    this.refresh.emit("refresh");
  }

  pageChanged(event) {
    this.page = event;
  }

  itemsPerPageChanged() {
    localStorage.setItem("itemsPerPage", "" + this.itemsPerPage);
  }

  selectAll(value) {
    for (let item of this.dataSorted) {
      item["selected11"] = value;
    }
    this.itemSelectedF();
  }

  itemSelectedF() {
    let selectedItems = this.dataSorted.filter((c) => c["selected11"] == true);

    this.itemSelected.emit(selectedItems.map((c) => c["item"]));
  }

  deleteItemF(item) {
    this.deleteItem.emit(item.item);
  }

  click(id) {
    if (this.format && this.format.navigation) {
      this.router.navigate([this.format.navigation.url, id]);
    }
  }

  sort(propertyId) {
    this.filters.sortToggle = -this.filters.sortToggle;
    this.filters.sort = propertyId;
    this.filtersChanged();
  }
}
