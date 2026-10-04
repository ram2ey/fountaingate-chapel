export function PdfStatementGenerator({query}:{query:string}){
 return <div className="flex flex-wrap gap-4 text-sm"><a className="text-indigo-700 underline" href={'/api/finance?'+query+'&format=pdf'}>Download PDF statement</a><a className="text-indigo-700 underline" href={'/api/finance?'+query+'&format=csv'}>Export CSV</a></div>;
}
