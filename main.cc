#include <G4Version.hh>

#if !defined(G4MULTITHREADED)
#include <G4RunManager.hh>
using RunManager = G4RunManager;
#else
#include <G4MTRunManager.hh>
using RunManager = G4MTRunManager;
#endif

#include <G4UImanager.hh>
#include <G4PhysListFactory.hh>

#include "init.h"
#include "field.h"
#include "actions.h"
#include "primary.h"
#include "geometry.h"

#include <cerrno>
#include <chrono>
#include <cstdio>
#include <cstdint>
#include <cstdlib>

#include <err.h>
#include <libgen.h>
#include <getopt.h>
#include <unistd.h>

#include <sys/time.h>
#include <sys/resource.h>
#include <sys/sysinfo.h>

/* globals */

bool cdash = false;
bool stats = false;
bool interactive = false;
int verbose = 0;
int nthreads = 1;
uint64_t seed = 0;
uint64_t nevents = 0;
const char *physics_list = "FTFP_BERT";
char *gdml = nullptr;
char *macro = nullptr;
double Bz = 0.0; /* in Tesla */

/* command line options */

struct option options[] = {
	{ "cdash",        no_argument,       NULL, 'd'},
	{ "help",         no_argument,       NULL, 'h'},
	{ "interactive",  no_argument,       NULL, 'i'},
	{ "quiet",        no_argument,       NULL, 'q'},
	{ "stats",        no_argument,       NULL, 's'},
	{ "verbose",      no_argument,       NULL, 'v'},
	{ "version",      no_argument,       NULL, 'V'},
	{ "energy",       required_argument, NULL, 'E'},
	{ "events",       required_argument, NULL, 'e'},
	{ "field",        required_argument, NULL, 'f'},
	{ "gdml",         required_argument, NULL, 'g'},
	{ "macro",        required_argument, NULL, 'm'},
	{ "particle",     required_argument, NULL, 'p'},
	{ "physics-list", required_argument, NULL, 'L'},
	{ "seed",         required_argument, NULL, 'S'},
	{ "threads",      required_argument, NULL, 'j'},
};

void help(const char *name)
{
	printf("Usage: %s [OPTIONS]\n\n", name);

	for (auto& opt : options)
		printf("\t-%c  --%-20s%-20s\n\n", opt.val, opt.name, opt.has_arg ? opt.name : "");
}

void parse_options(int argc, char **argv)
{
	if (argc == 1) {
		help(basename(argv[0]));
		exit(0);
	}

	for (;;) {
		switch(getopt_long(argc, argv, "dhiqsvVE:e:f:g:m:p:L:S:j:", options, NULL)) {
		case -1:
			return;

		case 'd':
			cdash = true;
			break;

		case 'i':
			interactive = true;
			break;

		case 's':
			stats = true;
			break;

		case 'h':
			help(basename(argv[0]));
			exit(0);

		case 'q':
			verbose = 0;
			break;

		case 'v':
			++verbose;
			break;

		case 'V': {
			const char *start = strchr(G4Version, '-');
			const char *stop  = strrchr(G4Version, '$');
			char version[64] = { 0, };
			strncpy(version, start+1, (size_t)(stop - start - 1));
			printf("%s for Geant4 %s\n", basename(argv[0]), version);
			exit(0);
		}

		case 'e':
			errno = 0; nevents = strtoull(optarg, nullptr, 10);

			if (errno)
				errx(errno, "%s: %lu", strerror(errno), nevents);
			break;

		case 'E': {
			double E = strtod(optarg, nullptr);
			if (E >= 0.0)
				set_primary_energy(E);
			else
				errx(EINVAL, "invalid value for energy: %s GeV", optarg);
			break;
		}

		case 'f':
			Bz = strtod(optarg, nullptr);
			break;

		case 'g':
			gdml = optarg;
			break;

		case 'm':
			macro = optarg;
			break;

		case 'p':
			set_primary_name(optarg);
			break;

		case 'L':
			physics_list = optarg;
			break;

		case 'S':
			seed = strtoull(optarg, nullptr, 10);
			break;

		case 'j':
#ifdef G4MULTITHREADED
			nthreads = atoi(optarg);

			if (nthreads <= 0)
				errx(EINVAL, "invalid number of threads");

			if (nthreads > get_nprocs())
				warnx("Using more threads than available processors in the system");
#else
			warnx("Geant4 has multithreading disabled");
#endif
			break;

		default:
			help(basename(argv[0]));
			errx(1, "unknown option");
		}
	}
}

static const char *tty;

void disable_stdout()
{
	tty = ttyname(fileno(stdout));
	if(!freopen("/dev/null", "a+", stdout))
		errx(1, "failed to disable stdout");
}

void enable_stdout()
{
	if(!freopen(tty, "w", stdout))
		errx(1, "failed to enable stdout");
}

void measurement_double(const char *name, double value)
{
	if (cdash)
		printf("<DartMeasurement name=\"%s\" type=\"numeric/double\">%g</DartMeasurement>\n", name, value);
	else
		printf("%30s  %g\n", name, value);
}

void measurement_string(const char *name, const char *value)
{
	if (cdash)
		printf("<DartMeasurement name=\"%s\" type=\"text/string\">%s</DartMeasurement>\n", name, value);
	else
		printf("%30s  %s\n", name, value);
}

int main(int argc, char **argv)
{
	parse_options(argc, argv);

	if (!verbose)
		disable_stdout();

	if (seed)
		G4Random::setTheSeed(seed);

	if (!gdml)
		errx(1, "no geometry file specified");

	G4PhysListFactory factory;

	if (!factory.IsReferencePhysList(physics_list))
		errx(1, "unknown physics list: %s", physics_list);

	auto runManager = new RunManager();

	G4UImanager* UI = G4UImanager::GetUIpointer();

	UI->ApplyCommand(G4String("/process/verbose       0"));
	UI->ApplyCommand(G4String("/process/em/verbose    0"));
	UI->ApplyCommand(G4String("/process/had/verbose   0"));
	UI->ApplyCommand(G4String("/process/eLoss/verbose 0"));

	UI->ApplyCommand(G4String("/control/verbose  ") + (verbose > 0 ? "1" : "0"));
	UI->ApplyCommand(G4String("/run/verbose      ") + (verbose > 1 ? "1" : "0"));
	UI->ApplyCommand(G4String("/event/verbose    ") + (verbose > 2 ? "1" : "0"));
	UI->ApplyCommand(G4String("/hits/verbose     ") + (verbose > 3 ? "1" : "0"));
	UI->ApplyCommand(G4String("/tracking/verbose ") + (verbose > 4 ? "1" : "0"));
	UI->ApplyCommand(G4String("/stepping/verbose ") + (verbose > 5 ? "1" : "0"));

#ifdef G4MULTITHREADED
	if (nthreads > 1)
		runManager->SetNumberOfThreads(nthreads);
#endif

	runManager->SetUserInitialization(new DetectorConstruction(gdml));
	runManager->SetUserInitialization(factory.GetReferencePhysList(physics_list));
	runManager->SetUserInitialization(new InitializationAction());

	struct rusage usage;

	if (getrusage(RUSAGE_SELF, &usage) != 0)
		errx(1, "Failed to get resource usage information for current process");

	double rss_before_init = (double) usage.ru_maxrss / 1024.0;

	auto t0 = std::chrono::high_resolution_clock::now();

	runManager->Initialize();

	auto t1 = std::chrono::high_resolution_clock::now();

	if (getrusage(RUSAGE_SELF, &usage) != 0)
		errx(1, "Failed to get resource usage information for current process");

	double rss_after_init = (double) usage.ru_maxrss / 1024.0;

	if (!runManager->ConfirmBeamOnCondition())
		errx(1, "Geant4 is not fully initialized");

	if (macro)
		UI->ApplyCommand(G4String("/control/execute ") + macro);

	if (nevents > 0)
		runManager->BeamOn(nevents);

	auto t2 = std::chrono::high_resolution_clock::now();

	if (getrusage(RUSAGE_SELF, &usage) != 0)
		errx(1, "Failed to get resource usage information for current process");

	double rss_after_loop = (double) usage.ru_maxrss / 1024.0;

	if (interactive) {
		enable_stdout();
		for (;;) {
			char command[1024];
			fprintf(stdout, ">>> ");
			if (!fgets(command, sizeof(command), stdin))
				break;
			fprintf(stderr, "command = '%s'\n", command);
			UI->ApplyCommand(command);
		}
		if (!verbose)
			disable_stdout();
	} else if (stats) {
		enable_stdout();
		double t_init = std::chrono::duration<double>(t1 - t0).count();
		double t_loop = std::chrono::duration<double>(t2 - t1).count();
		double t_both = std::chrono::duration<double>(t2 - t0).count();
		measurement_double("Initialization Cost (%)", 100.0 * t_init/t_both);
		measurement_double("Initialization Time (s)", t_init);
		measurement_double("Event Loop Run Time (s)", t_loop);
		measurement_double("Throughput (events/sec)", nevents/t_loop);
		if (nthreads > 1)
			measurement_double("Throughput (events/thread/sec)", nevents/(nthreads*t_loop));
		measurement_double("Maximum RSS Before Init (MB)", rss_before_init);
		measurement_double("Maximum RSS  After Init (MB)", rss_after_init);
		measurement_double("Maximum RSS  After Loop (MB)", rss_after_loop);
	}

	if (!verbose)
		disable_stdout();

	delete runManager;
	return 0;
}
