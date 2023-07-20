import {
  Component,
  EventEmitter,
  Input,
  IterableDiffers,
  KeyValueDiffer,
  KeyValueDiffers,
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

  private filtersDiffer;

  dataSorted;
  properties = [];
  page = 1;
  itemsPerPage = 30;
  numPerPage = [10, 20, 30, 50];

  showFiltersPopUp = false;

  applyFilters = false;

  filters = {
    sort: "",
    sortToggle: 1,
    searchWord: "",
  };

  constructor(private router: Router, private differs: KeyValueDiffers) {}

  ngOnInit(): void {
    this.getProperties();
    this.filtersDiffer = this.differs.find(this.filters).create();

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

    setTimeout(() => {
      this.applyFilters = true;
    }, 100);
  }

  ngDoCheck(): void {
    const changes = this.filtersDiffer.diff(this.filters);
    if (changes) {
      this.filtersChanged();
    }
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

    this.dataSorted = JSON.parse(JSON.stringify(this.data));

    console.log("====>this.properties", this.properties);
  }

  selectAll(value) {
    for (let item of this.data) {
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
  }

  filtersChanged() {
    console.log("====>filtersChanged()", this.filters);
    console.log("====>this.data", this.data);

    if (this.applyFilters == false) {
      return;
    }

    this.dataSorted = JSON.parse(JSON.stringify(this.data));

    //filters

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

    console.log("====>this.dataSorted", this.dataSorted);
  }

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

  removeFilter(fil) {
    console.log("=====>removeFilter", fil);
    this.filters[fil] = "";
  }

  getFilters() {
    let filters = [];
    for (let fil in this.filters) {
      if (this.filters[fil] != "" && fil != "sortToggle") {
        filters.push(fil);
      }
    }

    return filters;
  }

  getFilterValue(fil) {
    let result = this.filters[fil];

    if (fil == "searchWord") {
      result = "Search Word: '" + result + "'";
    }

    if (fil == "sort") {
      let propertyName = this.filters[fil];

      let prop = this.properties.find((c) => c.id == propertyName);
      if (prop) {
        propertyName = prop.name;
      }

      result =
        "Sort by: '" +
        propertyName +
        "' " +
        (this.filters.sortToggle == 1 ? "A-Z" : "Z-A");
    }

    return result;
  }

  filtersPopUp() {
    this.showFiltersPopUp = !this.showFiltersPopUp;
  }

  getAdditionalFilters() {
    let additionalFilters = this.properties.filter((c) => c.filter == true);

    return additionalFilters;
  }
}
