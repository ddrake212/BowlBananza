using System;
using System.ComponentModel.DataAnnotations;

public class BowlData
{
    [Key]                      // tell EF this *is* the primary key
    public int Year { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime? TieBreakerDate { get; set; }
    public bool? IsLocked { get; set; }
    public int? LeagueId { get; set; }
}
