;(function() {

var dataNS = odkmaker.namespace.load('odkmaker.data');

// a simple state machine to parse the flavour of TSV the spreadsheet programs put out.
// extant packaged code is either overfeatured at ~90KB compressed or underfeatured and
// unresilient to escape sequences due to complete reliance on regexp.
dataNS.parseTSV = function(raw)
{
    var inQuotedRecord = false;
    var rows = [], row = [], cell = null;
    while (raw.length > 0)
    {
        if (inQuotedRecord === false)
        {
            if (raw.charAt(0) === '"')
            {
                // start of record is a quote; mark that fact and deal with the contents later.
                inQuotedRecord = true;
                raw = raw.slice(1);
                cell = '';
            }
            else
            {
                // just chew up the entire record.
                var match = /^([^\t\n]*)([\t\n]|$)/.exec(raw);
                if (match[2] === '\t')
                    row.push(match[1]);
                else
                {
                    row.push(match[1]);
                    rows.push(row);
                    row = [];
                }
                raw = raw.slice(match[0].length);
            }
        }
        if (inQuotedRecord === true)
        {
            if (raw.charAt(0) === '"')
            {
                if (raw.charAt(1) === '"')
                {
                    // escaped-quote sequence.
                    cell += '"';
                    raw = raw.slice(2);
                }
                else if (raw.charAt(1) === '\t')
                {
                    // quote-bounded record end.
                    raw = raw.slice(2);
                    row.push(cell);
                    cell = '';
                    inQuotedRecord = false;
                }
                else if (raw.charAt(1) === '\n')
                {
                    // quote-bounded record end + row end.
                    raw = raw.slice(2);
                    row.push(cell);
                    rows.push(row);
                    row = [];
                    cell = '';
                    inQuotedRecord = false;
                }
                else if (raw.length === 1)
                {
                    // quote-bounded record end + EOF.
                    row.push(cell);
                    rows.push(row);
                    raw = '';
                }
                else
                {
                    // something is goofy and malformed. assume an errant literal quote
                    // and proceed.
                    raw = raw.slice(1);
                    cell += '"';
                }
            }
            else
            {
                // chew everything up through the next quote.
                var match = /^([^"]*)/.exec(raw);
                cell += match[1];
                raw = raw.slice(match[0].length);
            }
        }
    }

    return rows;
}

})();

