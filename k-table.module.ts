import { NgModule } from "@angular/core";

import { KTableComponent } from "./k-table.component";

import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { NgxPaginationModule } from "ngx-pagination";

@NgModule({
  declarations: [KTableComponent],
  imports: [BrowserModule, FormsModule, NgxPaginationModule],
  exports: [KTableComponent],
})
export class kTableModule {}
