#!/usr/bin/perl -w

use strict;
use open qw(:std :utf8);

my %profile;

foreach(<>)
{
	next if /^$/;
	my($period, $comm, $dso, $sym) = (/^\s+(\d+)\s+(\S+)\s+?(\S+)\s+?\[.\] (.*)$/);
	next if $period == 0;
	$profile{$comm}->{$dso}->{$sym} = $period;
}

print "{\n \"name\" : \"all\", \"children\": [\n";

for my $comm (sort keys %profile) {
	print "{\n \"name\": \"$comm\",\n \"children\": [\n";
	for my $dso (sort keys %{$profile{$comm}}) {
		print "  {\n   \"name\": \"$dso\",\n   \"children\": [\n";
		my $current_class = "";
		for my $sym (sort keys %{$profile{$comm}{$dso}}) {
			if ($sym =~ /::/) {
				my ($class, $method) = $sym =~ /(.*)::(.*)/;

				if ($current_class eq "") {
					# start new class
					print "    {\n     \"name\": \"$class\",\n     \"children\": [\n";
					print "       { \"name\": \"$method\", \"value\": $profile{$comm}{$dso}{$sym} }";
					$current_class = $class;
				} elsif (not $class eq $current_class) {
					# switch to next class
					print "\n     ]\n    },\n    {\n     \"name\": \"$class\",\n     \"children\": [\n";
					print "       { \"name\": \"$method\", \"value\": $profile{$comm}{$dso}{$sym} }";
					$current_class = $class;
				} else {
					# continuation of the same class, add a comma and the next method
					print ",\n       { \"name\": \"$method\", \"value\": $profile{$comm}{$dso}{$sym} }";
				}

				if (not $current_class eq "" and $sym eq (sort keys %{$profile{$comm}{$dso}})[-1]) {
					print "\n     ]\n    }\n";
					$current_class = "";
				}
			} else {
				print "\n     ]\n    },\n" if (not $current_class eq "");
				$current_class = "";
				print "    { \"name\": \"$sym\", \"value\": $profile{$comm}{$dso}{$sym} }";
				print "," unless $sym eq (sort keys %{$profile{$comm}{$dso}})[-1];
				print "\n";
			}
		}
		if (not $dso eq (sort keys %{$profile{$comm}})[-1]) {
			print "   ]\n  },\n";
		} else {
			print "   ]\n  }\n";
		}
	}
	print " ] \n}\n";
	print "," if (not $comm eq (sort keys %profile)[-1]);
	print "\n";
}

print "] }\n";
