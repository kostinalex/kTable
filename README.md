Table Component for Angular apps.
In: list of objects.
Out: html table with routing, sorting, pagination, search, download and etc.

format = {
// select: true,
// delete: true,
navigation: {
url: 'invoice',
byProperty: 'id',
},
ignore: ['id', 'tasks', 'company', 'companyId'],
properties: [
{
id: 'date',
date: true,
width: '500px',
},
{
id: 'closed',
bool: true,
width: '50px',
},
{
id: 'sum',
number: true,
},
{
id: 'hst',
name: 'HST',
number: true,
},
{
id: 'total',
number: true,
},
],
};
