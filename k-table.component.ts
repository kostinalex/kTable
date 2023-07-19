import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'kTable',
  templateUrl: './k-table.component.html',
  styleUrls: ['./k-table.component.scss'],
})
export class KTableComponent implements OnInit {
  @Input() data: Array<Object>;

  constructor() {}

  ngOnInit(): void {
    console.log('=====>data', this.data);
  }
}
