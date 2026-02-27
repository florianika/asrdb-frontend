import {
  AfterViewInit,
  Component,
  effect,
  inject,
  ViewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatNoDataRow,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
} from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import {
  MatFormField,
  MatLabel,
  MatSuffix,
} from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { FieldWorkService } from '../../../field-work.service';
import {
  FieldWorkStatistics,
  FieldWorkStatisticService,
} from '../../../field-work-statistic.service';
import { MatIcon } from '@angular/material/icon';
import { MUNICIPALITIES } from '../../../../../common/data/municipalities';

@Component({
  selector: 'asrdb-field-work-form-step3-statistic-table',
  standalone: true,
  imports: [
    MatButton,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatInput,
    MatSuffix,
    FormsModule,
    MatTable,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatPaginator,
    MatProgressSpinner,
    MatRow,
    MatRowDef,
    MatSort,
    MatSortHeader,
    MatHeaderCellDef,
    MatNoDataRow,
    MatIcon,
  ],
  providers: [],
  templateUrl: './field-work-form-step3-statistic-table.component.html',
  styleUrl: './field-work-form-step3-statistic-table.component.css',
})
export class FieldWorkFormStep3StatisticTableComponent implements AfterViewInit {
  private _fieldWorkService = inject(FieldWorkService);
  private _fieldWorkStatisticService = inject(FieldWorkStatisticService);
  private municipalityNameByCode = new Map(
    MUNICIPALITIES.map(municipality => [municipality.code, municipality.name])
  );

  public fieldWorkState = this._fieldWorkService.fieldWorkState;
  public statistics = this._fieldWorkStatisticService.statistics;
  public selectedMunicipality = '';
  public municipalityFilterValue = '';
  public municipalities = [...MUNICIPALITIES].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  public columns = ['municipality', 'ruleStatistics', 'bldStatistics'];
  public dataSource: MatTableDataSource<FieldWorkStatistics> =
    new MatTableDataSource<FieldWorkStatistics>();

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor() {
    effect(() => {
      this.dataSource.data = this.statistics().statistics;
      this.dataSource.paginator?.firstPage();
    });
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    this.dataSource.filterPredicate = (
      data: FieldWorkStatistics,
      filter: string
    ) => {
      if (!filter) {
        return true;
      }

      const filterCode = Number.parseInt(filter, 10);
      if (Number.isNaN(filterCode)) {
        return true;
      }

      const dataCode = Number(data.municipality);
      if (!Number.isNaN(dataCode)) {
        return dataCode === filterCode;
      }

      const municipalityName =
        this.municipalityNameByCode.get(filterCode)?.toLowerCase() ?? '';
      return this.formatMunicipality(data.municipality)
        .toLowerCase()
        .trim() === municipalityName;
    };
  }

  public startFieldWorkJobExecution() {
    const id = this.fieldWorkState().activeFieldWork?.fieldWorkId;
    if (id) {
      this._fieldWorkStatisticService.startFieldWorkJobExecution(id);
    }
  }

  public applyFilter(event: MatSelectChange) {
    const filterValue = (event.value ?? '').toString();
    this.selectedMunicipality = filterValue
      ? (this.municipalityNameByCode.get(Number.parseInt(filterValue, 10)) ?? '')
      : '';
    this.dataSource.filter = filterValue.trim();

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  public clearMunicipalityFilter(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.municipalityFilterValue = '';
  }

  public get filteredMunicipalities() {
    if (!this.municipalityFilterValue) {
      return this.municipalities;
    }

    return this.municipalities.filter(municipality =>
      municipality.name
        .toLowerCase()
        .includes(this.municipalityFilterValue.toLowerCase())
    );
  }

  public formatMunicipality(value: number | string): string {
    const code = Number(value);
    if (!Number.isNaN(code)) {
      return this.municipalityNameByCode.get(code) ?? value.toString();
    }

    return value.toString();
  }
}
