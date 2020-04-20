#include "geometry.h"

#include <G4GDMLParser.hh>

#include <err.h>
#include <unistd.h>

G4VPhysicalVolume *DetectorConstruction::Construct()
{
	if (access(gdml, R_OK))
		err(errno, "%s", gdml);

	G4GDMLParser p;

	p.Read(gdml, /* validate */ true);

	auto world = p.GetWorldVolume();

    if (!world)
        errx(1, "error reading geometry file");

    return world;
}
