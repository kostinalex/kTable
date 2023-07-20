import { NgModule } from "@angular/core";

import { KTableComponent } from "./k-table.component";

import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";

@NgModule({
  declarations: [KTableComponent],
  imports: [BrowserModule, FormsModule],
  exports: [KTableComponent],
})
export class kTableModule {}
