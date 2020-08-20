#include "primary.h"

#include <G4Event.hh>
#include <G4SystemOfUnits.hh>
#include <G4ParticleTable.hh>
#include <G4PrimaryParticle.hh>
#include <G4RandomDirection.hh>

#include <err.h>
#include <unistd.h>

static double primary_energy;
static const char *primary_name;
static const char *pythia_config_name;
static const G4ParticleDefinition *primary;

void set_primary_name(const char *name)
{
	primary_name = name;
}

void set_primary_energy(double E)
{
	primary_energy = E * GeV;
}

bool use_pythia()
{
	return pythia_config_name != nullptr;
}

void set_pythia_config(const char *name)
{
	pythia_config_name = name;
}

PrimaryGeneratorAction::PrimaryGeneratorAction()
{
	if (!(primary = G4ParticleTable::GetParticleTable()->FindParticle(primary_name)))
		errx(1, "unknown particle type: %s", primary_name);
}

void PrimaryGeneratorAction::GeneratePrimaries(G4Event* event)
{
	static const G4double time = 0.0;
	static const G4ThreeVector position(0.0, 0.0, 0.0);

	G4PrimaryVertex* vertex = new G4PrimaryVertex(position, time);
	G4PrimaryParticle* particle = new G4PrimaryParticle(primary);

	particle->SetKineticEnergy(primary_energy);
	particle->SetMomentumDirection(G4RandomDirection());
	particle->SetPolarization(0.0, 0.0, 0.0);
	vertex->SetPrimary(particle);
	event->AddPrimaryVertex(vertex);
}

#if USE_PYTHIA
static const char *pythia_defaults[] = {
	"Print:quiet = on",
	"Beams:idA = 2212",
	"Beams:idB = 2212",
	"Beams:eCM = 14000.0",
	"Init:showProcesses = off",
	"Init:showMultipartonInteractions = off",
	"Init:showChangedParticleData = off",
	"Stat:showProcessLevel = off",
	"Stat:showErrors = off",
};

static const char *pythia_minbias[] = {
	"HardQCD:all = on",
	"Beams:eCM = 14000.0",
	"PhaseSpace:pTHatMin = 20.0",
};

static const char *pythia_higgs[] = {
	"HiggsSM:all = on",
	"Beams:eCM = 14000.0",
	"PhaseSpace:pTHatMin = 20.0",
};

static const char *pythia_ttbar[] = {
	"Top:gg2ttbar = on",
	"Top:qqbar2ttbar = on",
	"Beams:eCM = 14000.0",
	"PhaseSpace:pTHatMin = 20.0",
};

PythiaPrimaryGeneratorAction::PythiaPrimaryGeneratorAction() {
	if (access(pythia_config_name, R_OK) == 0) {
		pythia.readFile(pythia_config_name);
	} else {
		for (const auto str : pythia_defaults)
			pythia.readString(str);

		if (strcmp("minbias", pythia_config_name) == 0) {
				for (const auto str : pythia_minbias)
					pythia.readString(str);
		} else if (strcmp("higgs", pythia_config_name) == 0) {
				for (const auto str : pythia_higgs)
					pythia.readString(str);
		} else if (strcmp("ttbar", pythia_config_name) == 0) {
				for (const auto str : pythia_ttbar)
					pythia.readString(str);
		} else {
			errx(1, "unknown Pythia configuration: %s", pythia_config_name);
		}
	}

	pythia.init();
}

void PythiaPrimaryGeneratorAction::GeneratePrimaries(G4Event *event)
{
	static const G4double time = 0.0;
	static const G4ThreeVector position(0.0, 0.0, 0.0);

	G4PrimaryVertex* vertex = new G4PrimaryVertex(position, time);

	pythia.next();

	for (auto i = 1, n = pythia.event.size(); i < n; ++i) {
		const auto& particle = pythia.event[i];

		if (!particle.isFinal())
			continue;

		G4PrimaryParticle* p = new G4PrimaryParticle(particle.id());
		p->SetMass(particle.m() * GeV);
		p->SetMomentum(particle.px() * GeV, particle.py() * GeV, particle.pz() * GeV);
		vertex->SetPrimary(p);
	}

	event->AddPrimaryVertex(vertex);
}
#endif
